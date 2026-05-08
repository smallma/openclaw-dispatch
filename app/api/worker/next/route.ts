import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const nextJob = await prisma.$transaction(async (tx) => {
      // 尋找最早建立，且 (沒有排定時間 或 排定時間早於目前) 的 TODO 任務 (Wait to do)
      const job = await tx.job.findFirst({
        where: {
          status: 'TODO',
          OR: [
            { scheduledAt: null },
            { scheduledAt: { lte: new Date() } }
          ]
        },
        orderBy: { createdAt: 'asc' },
      });

      if (!job) return null;

      // 抓到任務後立刻壓成 DOING
      return tx.job.update({
        where: { id: job.id },
        data: { status: 'DOING' },
      });
    });

    if (!nextJob) {
      return NextResponse.json({ message: 'No pending jobs available' }, { status: 404 });
    }

    return NextResponse.json(nextJob);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch next job' }, { status: 500 });
  }
}
