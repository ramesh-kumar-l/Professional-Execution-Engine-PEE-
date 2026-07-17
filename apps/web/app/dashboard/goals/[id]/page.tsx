import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { TaskForm } from '@/components/TaskForm';
import { getGoal, listTasks } from '@/lib/planning-api-client';
import { archiveGoalAction, archiveTaskAction, createTaskAction, toggleTaskDoneAction } from './actions';

export default async function GoalDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.accessToken) {
    notFound();
  }

  const goal = await getGoal(session.accessToken, params.id);
  if (!goal) {
    notFound();
  }

  const { data: tasks } = await listTasks(session.accessToken, goal.id);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-8">
      <h1 className="text-2xl font-semibold">{goal.title}</h1>
      <p>{goal.description}</p>
      <p>
        {goal.status} — {goal.progress.doneTasks}/{goal.progress.totalTasks} tasks ({goal.progress.percentComplete}
        %)
      </p>

      <div className="flex gap-3">
        <Link href={`/dashboard/goals/${goal.id}/edit`}>Edit goal</Link>
        <form action={archiveGoalAction.bind(null, goal.id)}>
          <button type="submit">Archive goal</button>
        </form>
      </div>

      <h2 className="text-xl font-semibold">Tasks</h2>
      <TaskForm action={createTaskAction.bind(null, goal.id)} />

      {tasks.length === 0 && <p>No tasks yet.</p>}

      <ul className="flex flex-col gap-2">
        {tasks.map((task) => (
          <li key={task.id} className="flex items-center justify-between border-b border-white/10 pb-2">
            <span>{task.title}</span>
            <div className="flex gap-2">
              <form action={toggleTaskDoneAction.bind(null, goal.id, task.id, task.status !== 'DONE')}>
                <button type="submit">{task.status === 'DONE' ? 'Mark not done' : 'Mark done'}</button>
              </form>
              <form action={archiveTaskAction.bind(null, goal.id, task.id)}>
                <button type="submit">Archive</button>
              </form>
            </div>
          </li>
        ))}
      </ul>

      <Link href={`/dashboard/projects/${goal.projectId}/goals`}>Back to goals</Link>
    </main>
  );
}
