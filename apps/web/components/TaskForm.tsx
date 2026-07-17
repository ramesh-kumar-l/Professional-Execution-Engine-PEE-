'use client';

import { useState, type FormEvent } from 'react';

export interface TaskFormState {
  error?: string;
}

interface TaskFormProps {
  action: (formData: FormData) => Promise<TaskFormState>;
}

export function TaskForm({ action }: TaskFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setPending(true);
    setError(null);

    const formData = new FormData(form);
    const result = await action(formData);

    setPending(false);
    if (result.error) {
      setError(result.error);
    } else {
      form.reset();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <label htmlFor="title" className="sr-only">
        New task title
      </label>
      <input id="title" name="title" type="text" placeholder="Add a task" maxLength={150} required />

      {error && (
        <p role="alert" className="text-red-400">
          {error}
        </p>
      )}

      <button type="submit" disabled={pending}>
        Add task
      </button>
    </form>
  );
}
