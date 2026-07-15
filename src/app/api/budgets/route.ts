import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const now = new Date();
    const month = parseInt(searchParams.get('month') || String(now.getMonth() + 1));
    const year = parseInt(searchParams.get('year') || String(now.getFullYear()));

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const [budgets, categories] = await Promise.all([
      db.budget.findMany({
        where: {
          userId: user.id,
          startDate: { gte: startDate },
          endDate: { lte: endDate },
        },
        include: {
          category: true,
        },
      }),
      db.category.findMany(),
    ]);

    return NextResponse.json({ budgets, categories });
  } catch (error: any) {
    console.error('Error fetching budgets:', error);
    return NextResponse.json({ error: 'Failed to fetch budgets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { categoryId, amount, month, year } = body;

    if (!categoryId) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 });
    }
    if (amount === undefined || isNaN(amount) || amount < 0) {
      return NextResponse.json({ error: 'Valid budget amount is required' }, { status: 400 });
    }

    const now = new Date();
    const budgetMonth = parseInt(month || String(now.getMonth() + 1));
    const budgetYear = parseInt(year || String(now.getFullYear()));

    const startDate = new Date(budgetYear, budgetMonth - 1, 1);
    const endDate = new Date(budgetYear, budgetMonth, 0, 23, 59, 59);

    // Look up category for dynamic budget naming
    const category = await db.category.findUnique({
      where: { id: categoryId },
    });
    const budgetName = category ? `${category.name} Budget` : 'Monthly Budget';

    const budget = await db.budget.upsert({
      where: {
        userId_categoryId_startDate_endDate: {
          userId: user.id,
          categoryId,
          startDate,
          endDate,
        },
      },
      update: {
        amount: parseFloat(amount),
        name: budgetName,
      },
      create: {
        userId: user.id,
        categoryId,
        amount: parseFloat(amount),
        name: budgetName,
        startDate,
        endDate,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(budget);
  } catch (error: any) {
    console.error('Error setting budget:', error);
    return NextResponse.json({ error: 'Failed to set budget' }, { status: 500 });
  }
}
