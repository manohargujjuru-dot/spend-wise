import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { fullName, email, password, mobile } = await request.json();

    if (!fullName || !email || !password) {
      return NextResponse.json({ error: 'Full name, email, and password are required' }, { status: 400 });
    }

    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Email is already registered' }, { status: 409 });
    }

    // Create user
    const user = await db.user.create({
      data: {
        fullName,
        email,
        password,
        mobile: mobile || '',
        currency: 'USD',
        language: 'en',
        theme: 'dark'
      },
    });

    // Create default accounts for new user
    await db.account.createMany({
      data: [
        { name: 'Cash Wallet', type: 'CASH', openingBalance: 200, currentBalance: 200, userId: user.id },
        { name: 'Primary Bank Account', type: 'BANK', openingBalance: 1000, currentBalance: 1000, userId: user.id },
        { name: 'Credit Card', type: 'CREDIT_CARD', openingBalance: 0, currentBalance: 0, userId: user.id },
        { name: 'UPI Mobile Wallet', type: 'WALLET', openingBalance: 100, currentBalance: 100, userId: user.id }
      ]
    });

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('spendwise-userid', user.id, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
