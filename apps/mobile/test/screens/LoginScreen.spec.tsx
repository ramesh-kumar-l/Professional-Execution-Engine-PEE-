import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

const mockLogin = jest.fn();
jest.mock('../../src/auth/auth-context', () => ({
  useAuth: () => ({ login: mockLogin }),
}));

import { LoginScreen } from '../../src/screens/LoginScreen';

describe('LoginScreen', () => {
  beforeEach(() => {
    mockLogin.mockReset();
  });

  it('submits the entered email and password', async () => {
    mockLogin.mockResolvedValue({});
    const { getByTestId } = await render(<LoginScreen />);

    await fireEvent.changeText(getByTestId('login-email'), 'ada@example.com');
    await fireEvent.changeText(getByTestId('login-password'), 'secret');
    await fireEvent.press(getByTestId('login-submit'));

    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith('ada@example.com', 'secret'));
  });

  it('shows the returned error message', async () => {
    mockLogin.mockResolvedValue({ error: 'Invalid email or password.' });
    const { getByTestId, findByTestId } = await render(<LoginScreen />);

    await fireEvent.changeText(getByTestId('login-email'), 'ada@example.com');
    await fireEvent.changeText(getByTestId('login-password'), 'wrong');
    await fireEvent.press(getByTestId('login-submit'));

    const error = await findByTestId('login-error');
    expect(error.props.children).toBe('Invalid email or password.');
  });
});
