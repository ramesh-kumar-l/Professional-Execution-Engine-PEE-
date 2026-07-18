import type { UserProfile } from '@pee/types';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { MobileAuthSession } from './mobile-auth-session';

interface AuthContextValue {
  session: MobileAuthSession;
  user: UserProfile | null;
  restoring: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Owns the one MobileAuthSession instance for the app — screens read/act through this context
 *  instead of constructing their own session, mirroring apps/desktop's "one AuthSession" discipline. */
export function AuthProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const session = useMemo(() => new MobileAuthSession(), []);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    session
      .restore()
      .then(setUser)
      .finally(() => setRestoring(false));
  }, [session]);

  const login = async (email: string, password: string): Promise<{ error?: string }> => {
    const result = await session.login(email, password);
    if ('error' in result) return { error: result.error };
    setUser(result.user);
    return {};
  };

  const logout = async (): Promise<void> => {
    await session.logout();
    setUser(null);
  };

  return <AuthContext.Provider value={{ session, user, restoring, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
