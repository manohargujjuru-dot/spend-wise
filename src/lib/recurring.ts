import { db } from './db';

export async function processRecurringTransactions(userId: string) {
  const now = new Date();
  
  // Find all active recurring transactions that are due
  const dueRecurring = await db.recurringTransaction.findMany({
    where: {
      userId,
      isActive: true,
      nextRunDate: { lte: now }
    },
    include: {
      account: true,
      category: true
    }
  });

  if (dueRecurring.length === 0) return;

  for (const rt of dueRecurring) {
    let currentNextDate = new Date(rt.nextRunDate);

    // Keep processing if it's due multiple times (e.g. multiple months missed)
    while (currentNextDate <= now) {
      // 1. Create Transaction
      await db.transaction.create({
        data: {
          userId,
          amount: rt.amount,
          type: rt.type as 'INCOME' | 'EXPENSE',
          categoryId: rt.categoryId,
          accountId: rt.accountId,
          description: `Auto-processed: ${rt.description || rt.category.name}`,
          merchant: 'Auto System',
          paymentMethod: 'NET_BANKING',
          date: new Date(currentNextDate),
          status: 'COMPLETED'
        }
      });

      // 2. Adjust Account Balance
      const balanceAdjustment = rt.type === 'INCOME' ? rt.amount : -rt.amount;
      await db.account.update({
        where: { id: rt.accountId },
        data: {
          currentBalance: {
            increment: balanceAdjustment
          }
        }
      });

      // 3. Create Notification
      const formattedAmount = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
      }).format(rt.amount);

      const msg = rt.type === 'INCOME'
        ? `Recurring credit of ${formattedAmount} added to account "${rt.account.name}" for ${rt.category.name}.`
        : `Recurring debit of ${formattedAmount} processed from account "${rt.account.name}" for ${rt.category.name}.`;

      await db.notification.create({
        data: {
          userId,
          type: rt.type === 'INCOME' ? 'INFO' : 'BUDGET_WARNING',
          message: msg
        }
      });

      // 4. Calculate next run date
      if (rt.frequency === 'MONTHLY') {
        currentNextDate.setMonth(currentNextDate.getMonth() + 1);
      } else if (rt.frequency === 'WEEKLY') {
        currentNextDate.setDate(currentNextDate.getDate() + 7);
      } else if (rt.frequency === 'DAILY') {
        currentNextDate.setDate(currentNextDate.getDate() + 1);
      } else if (rt.frequency === 'YEARLY') {
        currentNextDate.setFullYear(currentNextDate.getFullYear() + 1);
      } else {
        break;
      }
    }

    // 5. Update Recurring Transaction nextRunDate
    await db.recurringTransaction.update({
      where: { id: rt.id },
      data: {
        nextRunDate: currentNextDate
      }
    });
  }
}
