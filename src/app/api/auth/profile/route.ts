import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { fullName, mobile, currency, language, theme, profilePhoto } = body;

    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        fullName: fullName !== undefined ? fullName : user.fullName,
        mobile: mobile !== undefined ? mobile : user.mobile,
        currency: currency !== undefined ? currency : user.currency,
        language: language !== undefined ? language : user.language,
        theme: theme !== undefined ? theme : user.theme,
        profilePhoto: profilePhoto !== undefined ? profilePhoto : user.profilePhoto,
      },
    });

    const { password: _, ...userWithoutPassword } = updatedUser;
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export async function DELETE() {
  // logout functionality - clear cookie
  try {
    const response = NextResponse.json({ success: true });
    response.cookies.set('spendwise-userid', '', { maxAge: 0, path: '/' });
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
