import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { TaskForm } from '@/components/TaskForm';
import { listGoalActivity } from '@/lib/execution-api-client';
import { getGoal, listTasks } from '@/lib/planning-api-client';
import {
  archiveGoalAction,
  archiveTaskAction,
  completeTaskAction,
  createTaskAction,
  startTaskAction,
  toggleTaskDoneAction,
} from './actions';

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
  const { data: activity } = await listGoalActivity(session.accessToken, goal.id);

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
            <span>
              {task.title} ({task.status})
            </span>
            <div className="flex gap-2">
              {task.status === 'TODO' && (
                <form action={startTaskAction.bind(null, goal.id, task.id)}>
                  <button type="submit">Start</button>
                </form>
              )}
              {task.status === 'IN_PROGRESS' && (
                <form action={completeTaskAction.bind(null, goal.id, task.id)}>
                  <button type="submit">Complete</button>
                </form>
              )}
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

      <h2 className="text-xl font-semibold">Activity</h2>
      {activity.length === 0 && <p>No activity yet.</p>}
      <ul className="flex flex-col gap-1 text-sm text-white/70">
        {activity.map((event) => (
          <li key={event.id}>
            {new Date(event.createdAt).toLocaleString()} — {event.eventType} ({event.fromStatus ?? '—'} →{' '}
            {event.toStatus})
          </li>
        ))}
      </ul>

      <Link href={`/dashboard/projects/${goal.projectId}/goals`}>Back to goals</Link>
    </main>
  );
}
