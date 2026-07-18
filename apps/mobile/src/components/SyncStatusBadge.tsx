import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSync } from '../sync/sync-context';
import { SyncStatus } from '../sync/sync-types';

function describe(status: SyncStatus): string {
  if (status.phase === 'syncing') return 'Syncing…';
  if (status.phase === 'error') return `Sync error: ${status.message}`;
  if (status.phase === 'synced') return `Synced (pulled ${status.pulled}, pushed ${status.pushed})`;
  return 'Idle';
}

/** Mirrors apps/desktop's SyncStatusBadge.tsx, reading from SyncProvider's context instead of an
 *  IPC event subscription — there is no separate process here to push events across. */
export function SyncStatusBadge(): React.JSX.Element {
  const { status, syncNow } = useSync();
  const [pending, setPending] = useState(false);

  async function handleSyncNow(): Promise<void> {
    setPending(true);
    await syncNow();
    setPending(false);
  }

  return (
    <View className="flex-row items-center gap-2">
      <Text className="text-xs text-black dark:text-white">{describe(status)}</Text>
      <Pressable onPress={handleSyncNow} disabled={pending}>
        <Text className="text-xs text-blue-600">Sync now</Text>
      </Pressable>
    </View>
  );
}
