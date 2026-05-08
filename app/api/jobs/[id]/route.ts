import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    
    // Allow updating status and order
    const updatedData: any = {};
    if (data.status !== undefined) updatedData.status = data.status;
    if (data.order !== undefined) updatedData.order = data.order;
    if (data.title !== undefined) updatedData.title = data.title;
    if (data.instruction !== undefined) updatedData.instruction = data.instruction;
    if (data.scheduledAt !== undefined) updatedData.scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : null;
    if (data.cronExpression !== undefined) {
      updatedData.cronExpression = data.cronExpression;
      updatedData.isTemplate = !!data.cronExpression;
      if (data.cronExpression) {
        updatedData.status = 'ROUTINE'; // Auto move to ROUTINE if there is a Repeate Rule
      }
    }
    if (data.isTemplate !== undefined) updatedData.isTemplate = data.isTemplate;

    const job = await prisma.job.update({
      where: { id },
      data: updatedData,
    });

    return NextResponse.json(job);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update job' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.job.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 });
  }
}
