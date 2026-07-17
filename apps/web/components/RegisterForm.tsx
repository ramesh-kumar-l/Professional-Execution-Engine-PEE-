'use client';

import { useFormState } from 'react-dom';
import { registerAction } from '@/app/register/actions';

export function RegisterForm() {
  const [state, formAction] = useFormState(registerAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label htmlFor="displayName">Name</label>
      <input id="displayName" name="displayName" type="text" required />

      <label htmlFor="email">Email</label>
      <input id="email" name="email" type="email" autoComplete="email" required />

      <label htmlFor="password">Password</label>
      <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />

      {state?.error && (
        <p role="alert" className="text-red-400">
          {state.error}
        </p>
      )}

      <button type="submit">Create account</button>
    </form>
  );
}
