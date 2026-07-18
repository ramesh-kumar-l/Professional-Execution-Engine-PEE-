import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { OrganizationForm } from '../components/OrganizationForm';

describe('OrganizationForm', () => {
  it('calls the action with the entered name', async () => {
    const action = vi.fn().mockResolvedValue({});
    render(<OrganizationForm action={action} submitLabel="Create organization" />);

    fireEvent.change(screen.getByLabelText(/organization name/i), { target: { value: 'Acme Inc' } });
    fireEvent.click(screen.getByRole('button', { name: /create organization/i }));

    await waitFor(() => expect(action).toHaveBeenCalled());
    const formData = action.mock.calls[0][0] as FormData;
    expect(formData.get('name')).toBe('Acme Inc');
  });

  it('shows an error message returned by the action', async () => {
    const action = vi.fn().mockResolvedValue({ error: 'Could not create organization' });
    render(<OrganizationForm action={action} submitLabel="Create organization" />);

    fireEvent.change(screen.getByLabelText(/organization name/i), { target: { value: 'Acme Inc' } });
    fireEvent.click(screen.getByRole('button', { name: /create organization/i }));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/could not create organization/i));
  });
});
