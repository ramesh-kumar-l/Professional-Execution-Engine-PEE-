import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { listGoals } from '@/lib/planning-api-client';

export default async function ProjectGoalsPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.accessToken) {
    notFound();
  }

  const { data: goals } = await listGoals(session.accessToken, params.id);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Goals</h1>
        <Link href={`/dashboard/projects/${params.id}/goals/new`}>New goal</Link>
      </div>

      {goals.length === 0 && <p>No goals yet.</p>}

      <ul className="flex flex-col gap-2">
        {goals.map((goal) => (
          <li key={goal.id} className="flex flex-col gap-1 border-b border-white/10 pb-2">
            <Link href={`/dashboard/goals/${goal.id}`}>{goal.title}</Link>
            <span>
              {goal.status} — {goal.progress.doneTasks}/{goal.progress.totalTasks} tasks (
              {goal.progress.percentComplete}%)
            </span>
          </li>
        ))}
      </ul>

      <Link href={`/dashboard/projects/${params.id}`}>Back to project</Link>
    </main>
  );
}
