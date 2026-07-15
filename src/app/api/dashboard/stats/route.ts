import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { processRecurringTransactions } from '@/lib/recurring';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Process active recurring transactions before calculating stats
    await processRecurringTransactions(user.id);

    const { searchParams } = new URL(request.url);
    const now = new Date();
    const currentMonth = parseInt(searchParams.get('month') || String(now.getMonth() + 1));
    const currentYear = parseInt(searchParams.get('year') || String(now.getFullYear()));

    // 1. Fetch all user transactions
    const allTransactions = await db.transaction.findMany({
      where: { userId: user.id },
      include: {
        category: true,
      },
    });

    let totalIncome = 0;
    let totalExpenses = 0;

    // Spending totals by period
    let todaySpending = 0;
    let weeklySpending = 0;
    let monthlySpending = 0;

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    allTransactions.forEach((tx) => {
      const txDate = new Date(tx.date);
      if (tx.type === 'INCOME') {
        totalIncome += tx.amount;
      } else {
        totalExpenses += tx.amount;

        // Today spending
        if (txDate >= startOfToday) {
          todaySpending += tx.amount;
        }

        // Weekly spending (last 7 days)
        if (txDate >= sevenDaysAgo) {
          weeklySpending += tx.amount;
        }

        // Monthly spending (current selected month/year)
        if (txDate.getMonth() + 1 === currentMonth && txDate.getFullYear() === currentYear) {
          monthlySpending += tx.amount;
        }
      }
    });

    const netBalance = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netBalance / totalIncome) * 100 : 0;

    // 2. Category distribution for current month (expenses only)
    const currentMonthTransactions = allTransactions.filter((tx) => {
      const txDate = new Date(tx.date);
      return txDate.getMonth() + 1 === currentMonth && txDate.getFullYear() === currentYear;
    });

    const categoryTotals: Record<string, { id: string; name: string; amount: number; color: string; icon: string }> = {};

    currentMonthTransactions.forEach((tx) => {
      if (tx.type === 'EXPENSE') {
        if (!categoryTotals[tx.categoryId]) {
          categoryTotals[tx.categoryId] = {
            id: tx.categoryId,
            name: tx.category.name,
            amount: 0,
            color: tx.category.color,
            icon: tx.category.icon,
          };
        }
        categoryTotals[tx.categoryId].amount += tx.amount;
      }
    });

    const categoryDistribution = Object.values(categoryTotals);

    // 3. Budgets Progress
    const budgets = await db.budget.findMany({
      where: {
        userId: user.id,
        startDate: { lte: now },
        endDate: { gte: now }
      },
      include: {
        category: true,
      },
    });

    let totalBudgetLimit = 0;
    let totalBudgetSpent = 0;

    const budgetProgress = budgets.map((b) => {
      totalBudgetLimit += b.amount;
      const spent = currentMonthTransactions
        .filter((tx) => tx.type === 'EXPENSE' && tx.categoryId === b.categoryId)
        .reduce((sum, tx) => sum + tx.amount, 0);
      
      totalBudgetSpent += spent;

      return {
        id: b.id,
        categoryId: b.categoryId,
        categoryName: b.category.name,
        color: b.category.color,
        icon: b.category.icon,
        limit: b.amount,
        spent,
        percentage: b.amount > 0 ? Math.min((spent / b.amount) * 100, 100) : 0,
      };
    });

    const budgetRemaining = Math.max(0, totalBudgetLimit - totalBudgetSpent);

    // 4. Monthly Trend (last 6 months)
    const monthlyTrendData: Record<string, { month: string; income: number; expenses: number; sortKey: string }> = {};

    // Generate last 6 months keys
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(now.getMonth() - i);
      const mLabel = d.toLocaleString('default', { month: 'short' });
      const yearLabel = d.getFullYear();
      const key = `${mLabel} ${yearLabel}`;
      const sortKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyTrendData[key] = {
        month: key,
        income: 0,
        expenses: 0,
        sortKey,
      };
    }

    allTransactions.forEach((tx) => {
      const txDate = new Date(tx.date);
      const mLabel = txDate.toLocaleString('default', { month: 'short' });
      const yearLabel = txDate.getFullYear();
      const key = `${mLabel} ${yearLabel}`;
      
      if (monthlyTrendData[key]) {
        if (tx.type === 'INCOME') {
          monthlyTrendData[key].income += tx.amount;
        } else {
          monthlyTrendData[key].expenses += tx.amount;
        }
      }
    });

    const monthlyTrend = Object.values(monthlyTrendData).sort((a, b) => a.sortKey.localeCompare(b.sortKey));

    return NextResponse.json({
      summary: {
        totalIncome,
        totalExpenses,
        netBalance,
        totalSavings: netBalance,
        savingsRate: Math.max(0, parseFloat(savingsRate.toFixed(1))),
        todaySpending,
        weeklySpending,
        monthlySpending,
        monthlyBudget: totalBudgetLimit,
        budgetRemaining,
      },
      categoryDistribution,
      budgetProgress,
      monthlyTrend,
    });
  } catch (error: any) {
    console.error('Error generating dashboard stats:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}
