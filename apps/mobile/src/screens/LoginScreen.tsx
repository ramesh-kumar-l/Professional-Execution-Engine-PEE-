import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useAuth } from '../auth/auth-context';

/** Mirrors apps/desktop's Login.tsx layout/copy, adapted to React Native form controls. */
export function LoginScreen(): React.JSX.Element {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(): Promise<void> {
    setPending(true);
    setError(null);
    const result = await login(email, password);
    setPending(false);
    if (result.error) setError(result.error);
  }

  return (
    <View className="mx-auto flex w-full max-w-sm flex-1 justify-center gap-6 p-8">
      <Text className="text-2xl font-semibold text-black dark:text-white">Sign in</Text>

      <View className="flex flex-col gap-3">
        <Text className="text-black dark:text-white">Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          className="rounded border border-gray-300 p-3 text-black dark:border-gray-600 dark:text-white"
          testID="login-email"
        />

        <Text className="text-black dark:text-white">Password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="current-password"
          className="rounded border border-gray-300 p-3 text-black dark:border-gray-600 dark:text-white"
          testID="login-password"
        />

        {error && (
          <Text accessibilityRole="alert" className="text-red-500" testID="login-error">
            {error}
          </Text>
        )}

        <Pressable
          onPress={handleSubmit}
          disabled={pending}
          className="items-center rounded bg-blue-600 p-3"
          testID="login-submit"
        >
          <Text className="font-semibold text-white">{pending ? 'Signing in…' : 'Sign in'}</Text>
        </Pressable>
      </View>
    </View>
  );
}
