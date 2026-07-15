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
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const categoryId = searchParams.get('categoryId') || '';
    const accountId = searchParams.get('accountId') || '';

    // Default to last 30 days if no date range is provided
    const now = new Date();
    const last30Days = new Date();
    last30Days.setDate(now.getDate() - 30);
    const startDate = startDateParam ? new Date(startDateParam) : last30Days;
    const endDate = endDateParam ? new Date(endDateParam) : new Date();

    const where: any = {
      userId: user.id,
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (accountId) {
      where.accountId = accountId;
    }

    const transactions = await db.transaction.findMany({
      where,
      include: {
        category: true,
        account: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    let totalIncome = 0;
    let totalExpenses = 0;
    const categoryTotals: Record<string, { name: string; amount: number; color: string }> = {};
    const accountTotals: Record<string, { name: string; amount: number; type: string }> = {};

    transactions.forEach((tx: any) => {
      if (tx.type === 'INCOME') {
        totalIncome += tx.amount;
      } else {
        totalExpenses += tx.amount;

        // Group expenses by category
        if (!categoryTotals[tx.categoryId]) {
          categoryTotals[tx.categoryId] = {
            name: tx.category.name,
            amount: 0,
            color: tx.category.color,
          };
        }
        categoryTotals[tx.categoryId].amount += tx.amount;
      }

      // Group by account
      if (!accountTotals[tx.accountId]) {
        accountTotals[tx.accountId] = {
          name: tx.account.name,
          amount: 0,
          type: tx.account.type,
        };
      }
      accountTotals[tx.accountId].amount += tx.amount * (tx.type === 'INCOME' ? 1 : -1);
    });

    const categoryBreakdown = Object.values(categoryTotals);
    const accountBreakdown = Object.values(accountTotals);

    return NextResponse.json({
      summary: {
        totalIncome,
        totalExpenses,
        netBalance: totalIncome - totalExpenses,
        savingsRate: totalIncome > 0 ? parseFloat(((totalIncome - totalExpenses) / totalIncome * 100).toFixed(1)) : 0,
      },
      transactions,
      categoryBreakdown,
      accountBreakdown,
    });
  } catch (error) {
    console.error('Reports generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
