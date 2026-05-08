import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const jobs = await prisma.job.findMany({
      orderBy: [
        { status: 'asc' },
        { order: 'asc' },
        { createdAt: 'desc' }
      ]
    });
    return NextResponse.json(jobs);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { title, instruction, scheduledAt, cronExpression, isTemplate, status } = await request.json();
    
    if (!title || !instruction) {
      return NextResponse.json({ error: 'Title and instruction are required' }, { status: 400 });
    }

    const job = await prisma.job.create({
      data: {
        title,
        instruction,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        cronExpression: cronExpression || null,
        isTemplate: !!isTemplate,
        status: status || (cronExpression ? 'ROUTINE' : 'PENDING'), // Routine if cron, otherwise Pending
      },
    });

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
  }
}
