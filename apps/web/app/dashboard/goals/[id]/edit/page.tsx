import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { GoalForm } from '@/components/GoalForm';
import { getGoal } from '@/lib/planning-api-client';
import { updateGoalAction } from '../actions';

export default async function EditGoalPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.accessToken) {
    notFound();
  }

  const goal = await getGoal(session.accessToken, params.id);
  if (!goal) {
    notFound();
  }

  return (
    <main className="mx-auto flex max-w-sm flex-col gap-4 p-8">
      <h1 className="text-2xl font-semibold">Edit goal</h1>
      <GoalForm
        action={updateGoalAction.bind(null, goal.id)}
        defaultTitle={goal.title}
        defaultDescription={goal.description}
        defaultTargetDate={goal.targetDate}
        submitLabel="Save changes"
      />
    </main>
  );
}
