import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const [transactions, budgets] = await Promise.all([
      db.transaction.findMany({
        where: { userId: user.id },
        include: { category: true },
        orderBy: { date: 'desc' },
      }),
      db.budget.findMany({
        where: { userId: user.id },
        include: { category: true },
      }),
    ]);

    if (transactions.length === 0) {
      return NextResponse.json({
        healthScore: 100,
        insights: [
          "Welcome to SpendWise AI! Add transactions and budgets to get personalized insights."
        ],
        alerts: []
      });
    }

    // 1. Calculate stats
    let totalIncome = 0;
    let totalExpenses = 0;
    const categorySpends: Record<string, { name: string; amount: number }> = {};

    transactions.forEach((tx: any) => {
      if (tx.type === 'INCOME') {
        totalIncome += tx.amount;
      } else {
        totalExpenses += tx.amount;
        if (!categorySpends[tx.categoryId]) {
          categorySpends[tx.categoryId] = { name: tx.category.name, amount: 0 };
        }
        categorySpends[tx.categoryId].amount += tx.amount;
      }
    });

    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

    // 2. Compute Financial Health Score
    // - Savings Rate: max 40 points
    let ratePoints = 0;
    if (savingsRate > 20) ratePoints = 40;
    else if (savingsRate > 10) ratePoints = 30;
    else if (savingsRate > 0) ratePoints = 20;
    else ratePoints = 5;

    // - Budget Adherence: max 30 points
    let budgetPoints = 30;
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const currentMonthExpenses = transactions.filter((tx: any) => {
      const d = new Date(tx.date);
      return tx.type === 'EXPENSE' && d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
    });

    const alerts: string[] = [];
    budgets.forEach((b: any) => {
      const spent = currentMonthExpenses
        .filter((tx: any) => tx.categoryId === b.categoryId)
        .reduce((sum, tx: any) => sum + tx.amount, 0);

      if (spent >= b.amount) {
        budgetPoints -= 10;
        alerts.push(`Budget Alert: Exceeded monthly limit for "${b.category.name}" by $${(spent - b.amount).toFixed(0)}.`);
      } else if (spent >= b.amount * 0.85) {
        budgetPoints -= 5;
        alerts.push(`Budget Warning: Consumed 85%+ of your budget for "${b.category.name}".`);
      }
    });
    budgetPoints = Math.max(5, budgetPoints);

    // - Spending Trend Score: max 30 points (compares current month expenses to last month)
    let trendPoints = 25;
    const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    const lastMonthExpensesTotal = transactions
      .filter((tx) => {
        const d = new Date(tx.date);
        return tx.type === 'EXPENSE' && d.getMonth() + 1 === lastMonth && d.getFullYear() === lastMonthYear;
      })
      .reduce((sum, tx) => sum + tx.amount, 0);

    const currentMonthExpensesTotal = currentMonthExpenses.reduce((sum, tx) => sum + tx.amount, 0);

    if (lastMonthExpensesTotal > 0) {
      const pctIncrease = ((currentMonthExpensesTotal - lastMonthExpensesTotal) / lastMonthExpensesTotal) * 100;
      if (pctIncrease > 10) {
        trendPoints = 15;
        alerts.push(`Unusual Spending: Spending is ${pctIncrease.toFixed(0)}% higher than last month.`);
      } else if (pctIncrease < 0) {
        trendPoints = 30;
      }
    }

    const healthScore = ratePoints + budgetPoints + trendPoints;

    // 3. Generate Smart Insights list
    const insights: string[] = [];
    
    // Insight 1: Savings rate feedback
    if (savingsRate > 25) {
      insights.push(`Savings Star: Your savings rate is ${(savingsRate).toFixed(0)}%. You are in the top 5% of healthy spenders!`);
    } else if (savingsRate > 10) {
      insights.push(`On Track: Saving ${(savingsRate).toFixed(0)}% of income. Try automating deposits to boost it to 15%.`);
    } else if (savingsRate > 0) {
      insights.push(`Tight Margin: Your savings rate is only ${(savingsRate).toFixed(0)}%. Consider auditing small recurring subscriptions.`);
    } else {
      insights.push(`Deficit Alert: Spending exceeds income. Review your high fixed expenses like housing or housing costs.`);
    }

    // Insight 2: Top spending category analysis
    const sortedCategories = Object.values(categorySpends).sort((a, b) => b.amount - a.amount);
    if (sortedCategories.length > 0) {
      const topCat = sortedCategories[0];
      insights.push(`Top Cost: "${topCat.name}" is your primary expense at $${topCat.amount.toFixed(0)}. Try reducing this category by 10% to save an extra $${(topCat.amount * 0.1).toFixed(0)} monthly.`);
    }

    // Insight 3: Auto-categorize & prediction feedback
    insights.push(`Spending Forecast: SpendWise predicts your next month's spending will remain stable at around $${(totalExpenses / (transactions.length > 10 ? 3 : 1)).toFixed(0)}.`);

    // Insight 4: General savings suggestion
    if (totalExpenses > 100) {
      insights.push(`Smart Tip: Moving 15% of your food expenses to groceries can save you up to $45/month.`);
    }

    return NextResponse.json({
      healthScore,
      insights,
      alerts,
    });
  } catch (error) {
    console.error('AI Insights API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
