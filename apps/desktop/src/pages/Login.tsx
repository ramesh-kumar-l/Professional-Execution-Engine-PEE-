import type { UserProfile } from '@pee/types';
import { useState, type FormEvent } from 'react';
import { getBridge } from '../lib/pee-bridge';

export function Login({ onLoggedIn }: { onLoggedIn: (user: UserProfile) => void }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const result = await getBridge().auth.login(String(formData.get('email')), String(formData.get('password')));

    setPending(false);
    if ('error' in result) {
      setError(result.error);
      return;
    }
    onLoggedIn(result.user);
  }

  return (
    <main className="mx-auto flex max-w-sm flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3" aria-describedby={error ? 'login-error' : undefined}>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required />

        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required />

        {error && (
          <p id="login-error" role="alert" className="text-red-400">
            {error}
          </p>
        )}

        <button type="submit" disabled={pending}>
          {pending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}
