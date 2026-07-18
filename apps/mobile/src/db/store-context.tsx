import React, { createContext, useContext, useEffect, useState } from 'react';
import { openMobileDatabase } from './connection';
import { MobileStore } from './mobile-store';

interface StoreContextValue {
  store: MobileStore | null;
  ready: boolean;
}

const StoreContext = createContext<StoreContextValue>({ store: null, ready: false });

/** Opens the on-device SQLite database once at app startup and hands the resulting MobileStore
 *  to the rest of the tree — the mobile equivalent of apps/desktop's local-store-factory.ts. */
export function StoreProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [store, setStore] = useState<MobileStore | null>(null);

  useEffect(() => {
    openMobileDatabase().then((db) => setStore(new MobileStore(db)));
  }, []);

  return <StoreContext.Provider value={{ store, ready: store !== null }}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  return useContext(StoreContext);
}
