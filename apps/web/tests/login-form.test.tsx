import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { signIn } from 'next-auth/react';
import { describe, expect, it, vi } from 'vitest';
import { LoginForm } from '../components/LoginForm';

vi.mock('next-auth/react', () => ({ signIn: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

const noSso = { oidc: false, saml: false };

describe('LoginForm', () => {
  it('shows an error message when sign-in fails', async () => {
    (signIn as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ error: 'CredentialsSignin' });
    render(<LoginForm ssoStatus={noSso} />);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrong-pass' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/invalid email or password/i),
    );
  });

  it('submits the entered credentials to signIn', async () => {
    (signIn as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ error: undefined });
    render(<LoginForm ssoStatus={noSso} />);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'correct-pass' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() =>
      expect(signIn).toHaveBeenCalledWith('credentials', {
        email: 'a@b.com',
        password: 'correct-pass',
        redirect: false,
      }),
    );
  });

  it('renders no SSO buttons when neither provider is configured', () => {
    render(<LoginForm ssoStatus={noSso} />);
    expect(screen.queryByRole('button', { name: /sso/i })).not.toBeInTheDocument();
  });

  it('renders only the OIDC button when only OIDC is configured', () => {
    render(<LoginForm ssoStatus={{ oidc: true, saml: false }} />);
    expect(screen.getByRole('button', { name: /sign in with sso \(oidc\)/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /sign in with sso \(saml\)/i })).not.toBeInTheDocument();
  });

  it('calls signIn with the sso-saml provider id when the SAML button is clicked', () => {
    render(<LoginForm ssoStatus={{ oidc: false, saml: true }} />);
    fireEvent.click(screen.getByRole('button', { name: /sign in with sso \(saml\)/i }));
    expect(signIn).toHaveBeenCalledWith('sso-saml', { redirectTo: '/dashboard' });
  });
});
