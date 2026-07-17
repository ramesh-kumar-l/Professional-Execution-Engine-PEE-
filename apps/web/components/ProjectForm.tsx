'use client';

import { useState, type FormEvent } from 'react';

export interface ProjectFormState {
  error?: string;
}

interface ProjectFormProps {
  action: (formData: FormData) => Promise<ProjectFormState>;
  defaultName?: string;
  defaultDescription?: string | null;
  submitLabel: string;
}

export function ProjectForm({ action, defaultName, defaultDescription, submitLabel }: ProjectFormProps) {
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
      <label htmlFor="name">Name</label>
      <input id="name" name="name" type="text" defaultValue={defaultName} maxLength={150} required />

      <label htmlFor="description">Description</label>
      <textarea id="description" name="description" defaultValue={defaultDescription ?? ''} maxLength={2000} />

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
