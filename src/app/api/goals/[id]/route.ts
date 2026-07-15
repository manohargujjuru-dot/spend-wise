import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { name, targetAmount, currentAmount, deadline, status } = body;

    const currentGoal = await db.goal.findUnique({
      where: { id },
    });

    if (!currentGoal || currentGoal.userId !== user.id) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    const tAmount = targetAmount !== undefined ? parseFloat(targetAmount) : currentGoal.targetAmount;
    const cAmount = currentAmount !== undefined ? parseFloat(currentAmount) : currentGoal.currentAmount;
    
    let goalStatus = status || currentGoal.status;
    if (cAmount >= tAmount) {
      goalStatus = 'ACHIEVED';
    } else if (goalStatus === 'ACHIEVED' && cAmount < tAmount) {
      goalStatus = 'IN_PROGRESS';
    }

    const goal = await db.goal.update({
      where: { id },
      data: {
        name: name !== undefined ? name : currentGoal.name,
        targetAmount: tAmount,
        currentAmount: cAmount,
        deadline: deadline ? new Date(deadline) : currentGoal.deadline,
        status: goalStatus,
      },
    });

    // Check if milestone met and trigger notification
    if (cAmount >= tAmount && currentGoal.currentAmount < currentGoal.targetAmount) {
      await db.notification.create({
        data: {
          type: 'GOAL_MILESTONE',
          message: `Congratulations! You've achieved your savings goal: "${goal.name}"!`,
          userId: user.id,
        },
      });
    }

    return NextResponse.json(goal);
  } catch (error) {
    console.error('Update goal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const currentGoal = await db.goal.findUnique({
      where: { id },
    });

    if (!currentGoal || currentGoal.userId !== user.id) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    await db.goal.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete goal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
