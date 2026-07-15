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

    const originalTx = await db.transaction.findUnique({
      where: { id },
    });

    if (!originalTx || originalTx.userId !== user.id) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
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

    // 1. Revert original transaction balance effect
    const originalFactor = originalTx.type === 'INCOME' ? -1 : 1; 
    await db.account.update({
      where: { id: originalTx.accountId },
      data: {
        currentBalance: {
          increment: originalTx.amount * originalFactor,
        },
      },
    });

    // 2. Update Transaction record
    const transaction = await db.transaction.update({
      where: { id },
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
      },
      include: {
        category: true,
        account: true,
      },
    });

    // 3. Apply new balance effect
    const newFactor = type === 'INCOME' ? 1 : -1;
    await db.account.update({
      where: { id: accountId },
      data: {
        currentBalance: {
          increment: parseFloat(amount) * newFactor,
        },
      },
    });

    return NextResponse.json(transaction);
  } catch (error: any) {
    console.error('Error updating transaction:', error);
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
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

    const originalTx = await db.transaction.findUnique({
      where: { id },
    });

    if (!originalTx || originalTx.userId !== user.id) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // 1. Revert original transaction balance effect
    const originalFactor = originalTx.type === 'INCOME' ? -1 : 1; 
    await db.account.update({
      where: { id: originalTx.accountId },
      data: {
        currentBalance: {
          increment: originalTx.amount * originalFactor,
        },
      },
    });

    // 2. Delete transaction record
    await db.transaction.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 });
  }
}
