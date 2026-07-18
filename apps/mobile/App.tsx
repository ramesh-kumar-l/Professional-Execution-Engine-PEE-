import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/auth/auth-context';
import { StoreProvider } from './src/db/store-context';
import { RootNavigator } from './src/navigation/root-navigator';
import { SyncProvider } from './src/sync/sync-context';
import './src/global.css';

/** Root composition — AuthProvider and StoreProvider are independent (one MobileAuthSession,
 *  one MobileStore); SyncProvider depends on both, so it wraps innermost. */
export default function App(): React.JSX.Element {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <StoreProvider>
            <SyncProvider>
              <StatusBar style="auto" />
              <RootNavigator />
            </SyncProvider>
          </StoreProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
