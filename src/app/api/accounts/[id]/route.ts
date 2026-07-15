import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

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

    const account = await db.account.findUnique({
      where: { id },
    });

    if (!account || account.userId !== user.id) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    await db.account.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete account error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

    const account = await db.account.findUnique({
      where: { id },
    });

    if (!account || account.userId !== user.id) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, type, openingBalance, currentBalance } = body;

    const updatedAccount = await db.account.update({
      where: { id },
      data: {
        name: name !== undefined ? name : account.name,
        type: type !== undefined ? type : account.type,
        openingBalance: openingBalance !== undefined ? parseFloat(openingBalance) : account.openingBalance,
        currentBalance: currentBalance !== undefined ? parseFloat(currentBalance) : account.currentBalance,
      },
    });

    return NextResponse.json(updatedAccount);
  } catch (error) {
    console.error('Update account error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
