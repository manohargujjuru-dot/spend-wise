import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const goals = await db.goal.findMany({
      where: { userId: user.id },
      orderBy: { deadline: 'asc' },
    });

    return NextResponse.json(goals);
  } catch (error) {
    console.error('Fetch goals error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { name, targetAmount, currentAmount, deadline } = body;

    if (!name || !targetAmount || !deadline) {
      return NextResponse.json({ error: 'Goal name, target amount, and deadline are required' }, { status: 400 });
    }

    const goal = await db.goal.create({
      data: {
        name,
        targetAmount: parseFloat(targetAmount),
        currentAmount: parseFloat(currentAmount || '0'),
        deadline: new Date(deadline),
        status: 'IN_PROGRESS',
        userId: user.id,
      },
    });

    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    console.error('Create goal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
