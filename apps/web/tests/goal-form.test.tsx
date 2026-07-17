import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GoalForm } from '../components/GoalForm';

describe('GoalForm', () => {
  it('calls the action with the entered title and description', async () => {
    const action = vi.fn().mockResolvedValue({});
    render(<GoalForm action={action} submitLabel="Create goal" />);

    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Launch marketing site' } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Relaunch the product' } });
    fireEvent.click(screen.getByRole('button', { name: /create goal/i }));

    await waitFor(() => expect(action).toHaveBeenCalled());
    const formData = action.mock.calls[0][0] as FormData;
    expect(formData.get('title')).toBe('Launch marketing site');
    expect(formData.get('description')).toBe('Relaunch the product');
  });

  it('pre-fills the form with default values', () => {
    const action = vi.fn().mockResolvedValue({});
    render(
      <GoalForm
        action={action}
        defaultTitle="Existing Goal"
        defaultDescription="Existing description"
        defaultTargetDate="2026-12-01T00:00:00.000Z"
        submitLabel="Save changes"
      />,
    );

    expect(screen.getByLabelText(/title/i)).toHaveValue('Existing Goal');
    expect(screen.getByLabelText(/description/i)).toHaveValue('Existing description');
    expect(screen.getByLabelText(/target date/i)).toHaveValue('2026-12-01');
  });

  it('shows an error message returned by the action', async () => {
    const action = vi.fn().mockResolvedValue({ error: 'Could not create goal' });
    render(<GoalForm action={action} submitLabel="Create goal" />);

    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Launch marketing site' } });
    fireEvent.click(screen.getByRole('button', { name: /create goal/i }));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/could not create goal/i));
  });
});
