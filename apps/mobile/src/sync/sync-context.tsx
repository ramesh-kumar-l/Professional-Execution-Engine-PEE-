import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/auth-context';
import { useStore } from '../db/store-context';
import { BackgroundSyncRunner } from './background-sync';
import { SyncStatus } from './sync-types';

interface SyncContextValue {
  status: SyncStatus;
  syncNow: () => Promise<void>;
}

const SyncContext = createContext<SyncContextValue>({ status: { phase: 'idle' }, syncNow: async () => undefined });

/** Wires a BackgroundSyncRunner to the active MobileStore + MobileAuthSession once both are
 *  ready, starting the 30s background interval and exposing live status to SyncStatusBadge. */
export function SyncProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const { store } = useStore();
  const { session, user } = useAuth();
  const [status, setStatus] = useState<SyncStatus>({ phase: 'idle' });

  const runner = useMemo(() => (store ? new BackgroundSyncRunner(store, session) : null), [store, session]);

  useEffect(() => {
    if (!runner || !user) return undefined;
    const unsubscribe = runner.onStatusChange(setStatus);
    runner.runSync().catch(() => undefined);
    runner.start();
    return () => {
      unsubscribe();
      runner.stop();
    };
  }, [runner, user]);

  const syncNow = async (): Promise<void> => {
    if (runner) await runner.runSync();
  };

  return <SyncContext.Provider value={{ status, syncNow }}>{children}</SyncContext.Provider>;
}

export function useSync(): SyncContextValue {
  return useContext(SyncContext);
}
