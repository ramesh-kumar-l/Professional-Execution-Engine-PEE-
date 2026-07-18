import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { InviteMemberForm } from '../components/InviteMemberForm';

describe('InviteMemberForm', () => {
  it('defaults to the MEMBER role and calls the action with the entered email', async () => {
    const action = vi.fn().mockResolvedValue({});
    render(<InviteMemberForm action={action} />);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'teammate@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /invite/i }));

    await waitFor(() => expect(action).toHaveBeenCalled());
    const formData = action.mock.calls[0][0] as FormData;
    expect(formData.get('email')).toBe('teammate@example.com');
    expect(formData.get('role')).toBe('MEMBER');
  });

  it('shows an error message returned by the action', async () => {
    const action = vi.fn().mockResolvedValue({ error: 'Could not invite member' });
    render(<InviteMemberForm action={action} />);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'teammate@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /invite/i }));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/could not invite member/i));
  });
});
