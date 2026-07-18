'use client';

import type { SsoStatusResponse } from '@pee/types';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

interface LoginFormProps {
  ssoStatus: SsoStatusResponse;
}

export function LoginForm({ ssoStatus }: LoginFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const result = await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      redirect: false,
    });

    setPending(false);
    if (result?.error) {
      setError('Invalid email or password.');
      return;
    }
    router.push('/dashboard');
  }

  return (
    <div className="flex flex-col gap-4">
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

      {(ssoStatus.oidc || ssoStatus.saml) && (
        <div className="flex flex-col gap-2 border-t border-white/10 pt-4">
          <p className="text-sm">Or continue with your organization&rsquo;s SSO:</p>
          {ssoStatus.oidc && (
            <button type="button" onClick={() => signIn('sso-oidc', { redirectTo: '/dashboard' })}>
              Sign in with SSO (OIDC)
            </button>
          )}
          {ssoStatus.saml && (
            <button type="button" onClick={() => signIn('sso-saml', { redirectTo: '/dashboard' })}>
              Sign in with SSO (SAML)
            </button>
          )}
        </div>
      )}
    </div>
  );
}
