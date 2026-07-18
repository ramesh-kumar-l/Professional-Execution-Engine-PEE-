import { useEffect, useState, type FormEvent } from 'react';
import { AiSuggestionsPanel } from '../components/AiSuggestionsPanel';
import { getBridge } from '../lib/pee-bridge';

interface LocalGoalRow {
  id: string;
  title: string;
  status: string;
}

interface LocalTaskRow {
  id: string;
  title: string;
  status: string;
}

export function GoalDetail({ projectId, onBack }: { projectId: string; onBack: () => void }) {
  const [goals, setGoals] = useState<LocalGoalRow[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<LocalTaskRow[]>([]);
  const [goalTitle, setGoalTitle] = useState('');
  const [taskTitle, setTaskTitle] = useState('');

  async function refreshGoals() {
    setGoals(await getBridge().goals.list(projectId));
  }

  async function refreshTasks(goalId: string) {
    setTasks(await getBridge().tasks.list(goalId));
  }

  useEffect(() => {
    refreshGoals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    if (selectedGoalId) refreshTasks(selectedGoalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGoalId]);

  async function handleCreateGoal(event: FormEvent) {
    event.preventDefault();
    if (!goalTitle.trim()) return;
    await getBridge().goals.create({ projectId, title: goalTitle });
    setGoalTitle('');
    refreshGoals();
  }

  async function handleCreateTask(event: FormEvent) {
    event.preventDefault();
    if (!selectedGoalId || !taskTitle.trim()) return;
    await getBridge().tasks.create({ goalId: selectedGoalId, title: taskTitle });
    setTaskTitle('');
    refreshTasks(selectedGoalId);
  }

  async function handleStart(taskId: string) {
    await getBridge().execution.start(taskId);
    if (selectedGoalId) refreshTasks(selectedGoalId);
  }

  async function handleComplete(taskId: string) {
    await getBridge().execution.complete(taskId);
    if (selectedGoalId) refreshTasks(selectedGoalId);
  }

  return (
    <section className="flex flex-col gap-4">
      <button type="button" onClick={onBack}>
        Back to projects
      </button>

      <form onSubmit={handleCreateGoal} className="flex gap-2">
        <label htmlFor="goal-title" className="sr-only">
          Goal title
        </label>
        <input id="goal-title" value={goalTitle} onChange={(event) => setGoalTitle(event.target.value)} placeholder="New goal title" />
        <button type="submit">Add goal</button>
      </form>

      <ul className="flex flex-col gap-2">
        {goals.map((goal) => (
          <li key={goal.id}>
            <button
              type="button"
              onClick={() => setSelectedGoalId(goal.id)}
              className={goal.id === selectedGoalId ? 'font-semibold' : ''}
            >
              {goal.title} ({goal.status})
            </button>
          </li>
        ))}
      </ul>

      {selectedGoalId && (
        <div className="flex flex-col gap-3 border-t border-white/10 pt-3">
          <form onSubmit={handleCreateTask} className="flex gap-2">
            <label htmlFor="task-title" className="sr-only">
              Task title
            </label>
            <input id="task-title" value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="New task title" />
            <button type="submit">Add task</button>
          </form>

          <ul className="flex flex-col gap-2">
            {tasks.map((task) => (
              <li key={task.id} className="flex items-center justify-between border-b border-white/10 pb-2">
                <span>
                  {task.title} ({task.status})
                </span>
                <div className="flex gap-2">
                  <button type="button" onClick={() => handleStart(task.id)}>
                    Start
                  </button>
                  <button type="button" onClick={() => handleComplete(task.id)}>
                    Complete
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <AiSuggestionsPanel goalId={selectedGoalId} onAccepted={() => refreshTasks(selectedGoalId)} />
        </div>
      )}
    </section>
  );
}
