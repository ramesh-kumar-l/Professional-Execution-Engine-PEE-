import Link from 'next/link';
import { LoginForm } from '@/components/LoginForm';
import { ssoStatusRequest } from '@/lib/api-client';

export default async function LoginPage() {
  const ssoStatus = await ssoStatusRequest();

  return (
    <main className="mx-auto flex max-w-sm flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <LoginForm ssoStatus={ssoStatus} />
      <p>
        No account? <Link href="/register">Register</Link>
      </p>
    </main>
  );
}
