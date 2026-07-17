import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TaskForm } from '../components/TaskForm';

describe('TaskForm', () => {
  it('calls the action with the entered title', async () => {
    const action = vi.fn().mockResolvedValue({});
    render(<TaskForm action={action} />);

    fireEvent.change(screen.getByLabelText(/new task title/i), { target: { value: 'Write copy' } });
    fireEvent.click(screen.getByRole('button', { name: /add task/i }));

    await waitFor(() => expect(action).toHaveBeenCalled());
    const formData = action.mock.calls[0][0] as FormData;
    expect(formData.get('title')).toBe('Write copy');
  });

  it('shows an error message returned by the action', async () => {
    const action = vi.fn().mockResolvedValue({ error: 'Could not create task' });
    render(<TaskForm action={action} />);

    fireEvent.change(screen.getByLabelText(/new task title/i), { target: { value: 'Write copy' } });
    fireEvent.click(screen.getByRole('button', { name: /add task/i }));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/could not create task/i));
  });
});
