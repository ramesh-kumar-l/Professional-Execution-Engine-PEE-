import { GoalForm } from '@/components/GoalForm';
import { createGoalAction } from '../actions';

export default function NewGoalPage({ params }: { params: { id: string } }) {
  return (
    <main className="mx-auto flex max-w-sm flex-col gap-4 p-8">
      <h1 className="text-2xl font-semibold">New goal</h1>
      <GoalForm action={createGoalAction.bind(null, params.id)} submitLabel="Create goal" />
    </main>
  );
}
