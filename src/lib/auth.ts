import { cookies } from 'next/headers';
import { db } from './db';

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('spendwise-userid')?.value;
    
    if (userId) {
      const user = await db.user.findUnique({
        where: { id: userId },
      });
      if (user) return user;
    }
    
    // Fallback to the first seeded user (John Doe) for seamless testing
    const firstUser = await db.user.findFirst();
    return firstUser;
  } catch (error) {
    console.error('Error getting current user:', error);
    return await db.user.findFirst();
  }
}
