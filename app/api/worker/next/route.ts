import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // using interactive transaction to find the oldest pending job and update it to running
    const nextJob = await prisma.$transaction(async (tx) => {
      const job = await tx.job.findFirst({
        where: { status: 'Pending' },
        orderBy: { createdAt: 'asc' },
      });

      if (!job) return null;

      return tx.job.update({
        where: { id: job.id },
        data: { status: 'Running' },
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
