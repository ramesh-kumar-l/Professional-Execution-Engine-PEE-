'use client';

import { useState, type FormEvent } from 'react';

export interface ProjectFormState {
  error?: string;
}

interface ProjectFormProps {
  action: (formData: FormData) => Promise<ProjectFormState>;
  defaultName?: string;
  defaultDescription?: string | null;
  /** Only rendered when the caller belongs to more than one organization; a single (personal) org needs no picker. */
  organizations?: { id: string; name: string; isPersonal: boolean }[];
  submitLabel: string;
}

export function ProjectForm({ action, defaultName, defaultDescription, organizations, submitLabel }: ProjectFormProps) {
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

      {organizations && organizations.length > 1 && (
        <>
          <label htmlFor="organizationId">Organization</label>
          <select id="organizationId" name="organizationId" defaultValue={organizations[0].id}>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
                {org.isPersonal ? ' (personal)' : ''}
              </option>
            ))}
          </select>
        </>
      )}

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
