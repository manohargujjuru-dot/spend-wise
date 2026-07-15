import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const type = searchParams.get('type') || '';
    const accountId = searchParams.get('accountId') || '';
    
    const skip = (page - 1) * limit;

    const where: any = {
      userId: user.id,
    };
    
    if (search) {
      where.OR = [
        { description: { contains: search } },
        { merchant: { contains: search } },
      ];
    }
    
    if (category) {
      where.categoryId = category;
    }
    
    if (type) {
      where.type = type;
    }

    if (accountId) {
      where.accountId = accountId;
    }

    const [transactions, total] = await Promise.all([
      db.transaction.findMany({
        where,
        include: {
          category: true,
          account: true,
        },
        orderBy: {
          date: 'desc',
        },
        skip,
        take: limit,
      }),
      db.transaction.count({ where }),
    ]);

    return NextResponse.json({
      transactions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { amount, type, categoryId, accountId, paymentMethod, merchant, description, date, tags } = body;

    if (amount === undefined || isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
    }
    if (!type || (type !== 'INCOME' && type !== 'EXPENSE')) {
      return NextResponse.json({ error: 'Type must be INCOME or EXPENSE' }, { status: 400 });
    }
    if (!categoryId) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 });
    }
    if (!accountId) {
      return NextResponse.json({ error: 'Account is required' }, { status: 400 });
    }

    // 1. Create Transaction
    const transaction = await db.transaction.create({
      data: {
        amount: parseFloat(amount),
        type,
        categoryId,
        accountId,
        paymentMethod: paymentMethod || 'CASH',
        merchant: merchant || '',
        description: description || '',
        tags: tags || '',
        date: date ? new Date(date) : new Date(),
        userId: user.id,
      },
      include: {
        category: true,
        account: true,
      },
    });

    // 2. Adjust Account Balance
    const factor = type === 'INCOME' ? 1 : -1;
    await db.account.update({
      where: { id: accountId },
      data: {
        currentBalance: {
          increment: parseFloat(amount) * factor,
        },
      },
    });

    // 3. Budget Exceeded check
    if (type === 'EXPENSE') {
      const txDate = new Date(transaction.date);
      const startOfMonth = new Date(txDate.getFullYear(), txDate.getMonth(), 1);
      const endOfMonth = new Date(txDate.getFullYear(), txDate.getMonth() + 1, 0, 23, 59, 59);

      const budget = await db.budget.findFirst({
        where: {
          userId: user.id,
          categoryId,
          startDate: { lte: txDate },
          endDate: { gte: txDate },
        },
      });

      if (budget) {
        // Calculate current month spent for this category
        const totalSpentResult = await db.transaction.aggregate({
          where: {
            userId: user.id,
            categoryId,
            type: 'EXPENSE',
            date: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
          _sum: {
            amount: true,
          },
        });

        const totalSpent = totalSpentResult._sum.amount || 0;

        if (totalSpent >= budget.amount) {
          await db.notification.create({
            data: {
              type: 'BUDGET_EXCEEDED',
              message: `Alert: Your spending on "${transaction.category.name}" has reached $${totalSpent.toFixed(0)}, exceeding your monthly budget of $${budget.amount.toFixed(0)}!`,
              userId: user.id,
            },
          });
        }
      }
    }

    return NextResponse.json(transaction, { status: 201 });
  } catch (error: any) {
    console.error('Error creating transaction:', error);
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}
