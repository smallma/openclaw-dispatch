import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, logs, result } = body;

    const dataToUpdate: any = {};
    if (status) dataToUpdate.status = status;
    if (result) dataToUpdate.result = result;

    if (logs) {
      // Fetch existing logs to append
      const existingJob = await prisma.job.findUnique({ where: { id } });
      if (existingJob) {
        let combinedLogs = existingJob.logs 
          ? `${existingJob.logs}\n${logs}`
          : logs;
          
        const MAX_LOGS = 10000;
        if (combinedLogs.length > MAX_LOGS) {
          combinedLogs = '...[Logs truncated to save database space]...\n' + combinedLogs.slice(-MAX_LOGS);
        }
        
        dataToUpdate.logs = combinedLogs;
      }
    }

    const updatedJob = await prisma.job.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json(updatedJob);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update job' }, { status: 500 });
  }
}
