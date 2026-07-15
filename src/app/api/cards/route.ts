import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET: Fetch all user's cards
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const cards = await db.card.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(cards);
  } catch (error) {
    console.error('Error fetching cards:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Save a new card
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { name, number, holderName, expiry, type, network, bankName } = body;

    if (!name || !number || !holderName || !expiry || !type || !network || !bankName) {
      return NextResponse.json({ error: 'Missing required card fields' }, { status: 400 });
    }

    const card = await db.card.create({
      data: {
        name,
        number,
        holderName,
        expiry,
        type, // "DEBIT" or "CREDIT"
        network, // "VISA", "MASTERCARD", "RUPAY", "AMEX"
        bankName,
        userId: user.id
      }
    });

    return NextResponse.json(card, { status: 201 });
  } catch (error) {
    console.error('Error saving card:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
