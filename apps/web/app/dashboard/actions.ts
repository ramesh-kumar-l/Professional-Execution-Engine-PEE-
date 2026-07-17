'use server';

import { auth, signOut } from '@/auth';
import { logoutRequest } from '@/lib/api-client';

export async function logoutAction(): Promise<void> {
  const session = await auth();
  if (session?.refreshToken) {
    await logoutRequest(session.refreshToken);
  }
  await signOut({ redirectTo: '/login' });
}
