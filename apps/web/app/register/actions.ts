'use server';

import { redirect } from 'next/navigation';
import { registerRequest } from '@/lib/api-client';

export interface RegisterActionState {
  error?: string;
}

export async function registerAction(
  _prevState: RegisterActionState | undefined,
  formData: FormData,
): Promise<RegisterActionState> {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  const displayName = String(formData.get('displayName') ?? '');

  const result = await registerRequest(email, password, displayName);
  if ('error' in result) {
    return { error: result.error };
  }

  redirect('/login');
}
