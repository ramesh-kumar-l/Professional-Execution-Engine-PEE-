'use client';

import { useState, type FormEvent } from 'react';

export interface InviteMemberFormState {
  error?: string;
}

interface InviteMemberFormProps {
  action: (formData: FormData) => Promise<InviteMemberFormState>;
}

export function InviteMemberForm({ action }: InviteMemberFormProps) {
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
      <label htmlFor="email">Email of an existing PEE user</label>
      <input id="email" name="email" type="email" required />

      <label htmlFor="role">Role</label>
      <select id="role" name="role" defaultValue="MEMBER">
        <option value="MEMBER">Member</option>
        <option value="ADMIN">Admin</option>
        <option value="OWNER">Owner</option>
      </select>

      {error && (
        <p role="alert" className="text-red-400">
          {error}
        </p>
      )}

      <button type="submit" disabled={pending}>
        Invite
      </button>
    </form>
  );
}
