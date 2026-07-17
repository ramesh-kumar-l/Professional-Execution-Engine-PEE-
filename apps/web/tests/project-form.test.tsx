import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ProjectForm } from '../components/ProjectForm';

describe('ProjectForm', () => {
  it('calls the action with the entered name and description', async () => {
    const action = vi.fn().mockResolvedValue({});
    render(<ProjectForm action={action} submitLabel="Create project" />);

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Website Relaunch' } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Rebuild the site' } });
    fireEvent.click(screen.getByRole('button', { name: /create project/i }));

    await waitFor(() => expect(action).toHaveBeenCalled());
    const formData = action.mock.calls[0][0] as FormData;
    expect(formData.get('name')).toBe('Website Relaunch');
    expect(formData.get('description')).toBe('Rebuild the site');
  });

  it('pre-fills the form with default values', () => {
    const action = vi.fn().mockResolvedValue({});
    render(
      <ProjectForm
        action={action}
        defaultName="Existing Project"
        defaultDescription="Existing description"
        submitLabel="Save changes"
      />,
    );

    expect(screen.getByLabelText(/name/i)).toHaveValue('Existing Project');
    expect(screen.getByLabelText(/description/i)).toHaveValue('Existing description');
  });

  it('shows an error message returned by the action', async () => {
    const action = vi.fn().mockResolvedValue({ error: 'Could not create project' });
    render(<ProjectForm action={action} submitLabel="Create project" />);

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Website Relaunch' } });
    fireEvent.click(screen.getByRole('button', { name: /create project/i }));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/could not create project/i));
  });
});
