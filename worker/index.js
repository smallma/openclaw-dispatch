require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { spawn } = require('child_process');
const parser = require('cron-parser');
// using Prisma directly to scan jobs
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const API_BASE = 'http://localhost:3000/api';
const POLL_INTERVAL = 60000; // 60 seconds
const WORKER_SECRET = process.env.WORKER_SECRET;

let currentOpenclawProcess = null;

if (!WORKER_SECRET) {
  console.error('[Worker] Fatal Error: WORKER_SECRET environment variable is missing.');
  process.exit(1);
}

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${WORKER_SECRET}`
});

async function checkCronJobs() {
  try {
    const templates = await prisma.job.findMany({
      where: { 
        isTemplate: true,
        cronExpression: { not: null }
      }
    });

    const now = new Date();
    
    for (const t of templates) {
      if (!t.cronExpression) continue;
      
      try {
        const interval = parser.parseExpression(t.cronExpression);
        // prev() is the last cron trigger time
        const prev = interval.prev().toDate();
        
        // See if prev() triggered within the last POLL_INTERVAL (e.g. 1 minute)
        if (now.getTime() - prev.getTime() <= POLL_INTERVAL) {
          console.log(`[Worker - Cron] Routine "${t.title}" triggered at ${now.toISOString()}. Spawning new job.`);
          
          await prisma.job.create({
            data: {
              title: `[Routine] ${t.title}`,
              instruction: t.instruction,
              status: 'PENDING',
              order: 0,
              isTemplate: false,
            }
          });
        }
      } catch (err) {
        console.error(`[Worker - Cron] Error parsing expression "${t.cronExpression}" for job ${t.id}`, err.message);
      }
    }
  } catch (err) {
    console.error('[Worker - Cron] DB check failed:', err.message);
  }
}

async function pollJobs() {
  try {
    await checkCronJobs(); // evaluate crons first
    
    const res = await fetch(`${API_BASE}/worker/next`, {
      method: 'GET',
      headers: getHeaders()
    });

    if (res.status === 404) {
      console.log('[Worker] No pending jobs found. Waiting...');
      return;
    }
    if (res.status === 401) {
      console.error('[Worker] Authentication failed: invalid WORKER_SECRET.');
      return;
    }
    if (!res.ok) {
      throw new Error(`Failed to fetch next job: ${res.statusText}`);
    }

    const job = await res.json();
    console.log(`[Worker] Picked up job ${job.id}: ${job.title}`);
    await executeJob(job);
  } catch (err) {
    if (err.cause?.code === 'ECONNREFUSED') {
      console.log('[Worker] Backend API not reachable. Retrying later...');
    } else {
      console.error('[Worker] Error polling jobs:', err.message);
    }
  }
}

async function executeJob(job) {
  return new Promise((resolve) => {
    console.log(`[Worker] Starting openclaw for job ${job.id}`);


    const cmd = process.env.OPENCLAW_PATH || 'openclaw';
    
    // 👇 這裡我們強化系統小抄，強制要求它使用搜尋工具
    const systemPrompt = `
    \n\n[System Policy: 
    1. 為了確保資訊準確，當涉及天氣、新聞、股價或任何時效性資訊時，必須先執行 'google-search' 或 'weather' 工具，嚴禁根據內部知識記憶回答。
    2. 即使你覺得自己知道答案，也必須上網核對 2026 年的最新消息。
    3. 任務完成後，請發送 Telegram 訊息至目標 ID 1873208709]`;

    const finalInstruction = job.instruction + systemPrompt;

    currentOpenclawProcess = spawn(cmd, [
      'agent', 
      '--session-id', job.id, 
      '--message', finalInstruction
    ]);
    let accumulatedLogs = '';

    // Periodically sync logs every 5 seconds
    const intervalId = setInterval(async () => {
      if (accumulatedLogs.length > 0) {
        try {
          await fetch(`${API_BASE}/worker/${job.id}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify({ logs: accumulatedLogs }),
          });
          accumulatedLogs = ''; // clear after sending
        } catch (e) {
          console.error(`[Worker] Failed to sync logs for job ${job.id}:`, e.message);
        }
      }
    }, 5000);

    currentOpenclawProcess.stdout.on('data', (data) => {
      const output = data.toString();
      process.stdout.write(output);
      accumulatedLogs += output;
    });

    currentOpenclawProcess.stderr.on('data', (data) => {
      const output = data.toString();
      process.stderr.write(output);
      accumulatedLogs += output;
    });

    currentOpenclawProcess.on('close', async (code) => {
      clearInterval(intervalId);
      currentOpenclawProcess = null;

      const status = code === 0 ? 'DONE' : 'FAILED';
      const result = code === 0 ? 'Openclaw finished successfully.' : `Openclaw exited with code ${code}`;

      try {
        const finalRes = await fetch(`${API_BASE}/worker/${job.id}`, {
          method: 'PATCH',
          headers: getHeaders(),
          body: JSON.stringify({
            status,
            logs: accumulatedLogs, // flush remaining logs
            result,
          }),
        });

        if (!finalRes.ok) {
          console.error(`[Worker] Error: Dashboard rejected final update (${finalRes.statusText})`);
        } else {
          console.log(`[Worker] Finished job ${job.id} with status ${status}`);
        }
      } catch (err) {
        console.error(`[Worker] Failed to update final status for job ${job.id}:`, err.message);
      }

      resolve();
    });
  });
}

// Graceful Shutdown Mechanism
function handleShutdown() {
  console.log('\n[Worker] Received shutdown signal. Gracefully shutting down...');
  if (currentOpenclawProcess) {
    console.log('[Worker] Terminating active Openclaw process to prevent Zombies...');
    currentOpenclawProcess.kill();
  }
  process.exit(0);
}

process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);

console.log('[Worker] Starting polling loop...');
pollJobs();
setInterval(pollJobs, POLL_INTERVAL);
