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

    const accounts = await db.account.findMany({
      where: { userId: user.id },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(accounts);
  } catch (error) {
    console.error('Fetch accounts error:', error);
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
    const { name, type, openingBalance } = body;

    if (!name || !type) {
      return NextResponse.json({ error: 'Account name and type are required' }, { status: 400 });
    }

    const balance = parseFloat(openingBalance || '0');

    const account = await db.account.create({
      data: {
        name,
        type,
        openingBalance: balance,
        currentBalance: balance,
        userId: user.id,
      },
    });

    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    console.error('Create account error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
