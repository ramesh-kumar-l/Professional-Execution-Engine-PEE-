'use client';

import { useState, type FormEvent } from 'react';

export interface GoalFormState {
  error?: string;
}

interface GoalFormProps {
  action: (formData: FormData) => Promise<GoalFormState>;
  defaultTitle?: string;
  defaultDescription?: string | null;
  defaultTargetDate?: string | null;
  submitLabel: string;
}

export function GoalForm({ action, defaultTitle, defaultDescription, defaultTargetDate, submitLabel }: GoalFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const result = await action(formData);

    setPending(false);
    if (result.error) {
      setError(result.error);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label htmlFor="title">Title</label>
      <input id="title" name="title" type="text" defaultValue={defaultTitle} maxLength={150} required />

      <label htmlFor="description">Description</label>
      <textarea id="description" name="description" defaultValue={defaultDescription ?? ''} maxLength={2000} />

      <label htmlFor="targetDate">Target date</label>
      <input id="targetDate" name="targetDate" type="date" defaultValue={defaultTargetDate?.slice(0, 10) ?? ''} />

      {error && (
        <p role="alert" className="text-red-400">
          {error}
        </p>
      )}

      <button type="submit" disabled={pending}>
        {submitLabel}
      </button>
    </form>
  );
}
