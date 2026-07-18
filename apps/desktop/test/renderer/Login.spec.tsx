import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Login } from '../../src/pages/Login';

declare global {
  // eslint-disable-next-line no-var
  var pee: unknown;
}

afterEach(() => {
  delete (window as unknown as { pee?: unknown }).pee;
});

describe('Login', () => {
  it('calls onLoggedIn after a successful login', async () => {
    const login = vi.fn().mockResolvedValue({ user: { id: 'u1', email: 'a@a.com', displayName: 'A', role: 'USER' } });
    (window as unknown as { pee: unknown }).pee = { auth: { login } };
    const onLoggedIn = vi.fn();

    render(<Login onLoggedIn={onLoggedIn} />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@a.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() =>
      expect(onLoggedIn).toHaveBeenCalledWith({ id: 'u1', email: 'a@a.com', displayName: 'A', role: 'USER' }),
    );
  });

  it('shows an error message on invalid credentials', async () => {
    const login = vi.fn().mockResolvedValue({ error: 'Invalid email or password.' });
    (window as unknown as { pee: unknown }).pee = { auth: { login } };

    render(<Login onLoggedIn={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@a.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password.');
  });
});
