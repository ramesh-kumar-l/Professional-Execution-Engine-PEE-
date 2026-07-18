import Link from 'next/link';
import { auth } from '@/auth';
import { logoutAction } from './actions';

export default async function DashboardPage() {
  const session = await auth();

  return (
    <main className="mx-auto flex max-w-sm flex-col gap-4 p-8">
      <h1 className="text-2xl font-semibold">Welcome, {session?.user.displayName}</h1>
      <p>{session?.user.email}</p>
      <Link href="/dashboard/projects">Projects</Link>
      <Link href="/dashboard/execution">Active work</Link>
      <form action={logoutAction}>
        <button type="submit">Log out</button>
      </form>
    </main>
  );
}
