import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { listActiveExecutions } from '@/lib/execution-api-client';
import { completeActiveTaskAction } from './actions';

function elapsed(startedAt: string): string {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(startedAt).getTime()) / 1000));
  const minutes = Math.floor(seconds / 60);
  return minutes < 1 ? '<1 min' : `${minutes} min`;
}

export default async function ActiveWorkPage() {
  const session = await auth();
  if (!session?.accessToken) {
    notFound();
  }

  const active = await listActiveExecutions(session.accessToken);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-8">
      <h1 className="text-2xl font-semibold">Active work</h1>
      <p>Everything currently being executed, across every project and goal.</p>

      {active.length === 0 && <p>Nothing is currently active — start a task from its goal page.</p>}

      <ul className="flex flex-col gap-2">
        {active.map((item) => (
          <li key={item.session.id} className="flex items-center justify-between border-b border-white/10 pb-2">
            <div>
              <div>{item.taskTitle}</div>
              <div className="text-sm text-white/70">
                <Link href={`/dashboard/goals/${item.goalId}`}>{item.goalTitle}</Link> — running for{' '}
                {elapsed(item.session.startedAt)}
              </div>
            </div>
            <form action={completeActiveTaskAction.bind(null, item.goalId, item.session.taskId)}>
              <button type="submit">Complete</button>
            </form>
          </li>
        ))}
      </ul>
    </main>
  );
}
