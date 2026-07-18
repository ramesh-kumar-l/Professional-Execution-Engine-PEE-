'use client';

import { useState, type FormEvent } from 'react';

export interface OrganizationFormState {
  error?: string;
}

interface OrganizationFormProps {
  action: (formData: FormData) => Promise<OrganizationFormState>;
  submitLabel: string;
}

export function OrganizationForm({ action, submitLabel }: OrganizationFormProps) {
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
      <label htmlFor="name">Organization name</label>
      <input id="name" name="name" type="text" maxLength={150} required />

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
