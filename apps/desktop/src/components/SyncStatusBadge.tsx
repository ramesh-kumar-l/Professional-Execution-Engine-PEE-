import { useEffect, useState } from 'react';
import { getBridge } from '../lib/pee-bridge';

interface SyncStatus {
  phase: 'idle' | 'syncing' | 'synced' | 'error';
  at?: string;
  pulled?: number;
  pushed?: number;
  message?: string;
}

function describe(status: SyncStatus): string {
  if (status.phase === 'syncing') return 'Syncing…';
  if (status.phase === 'error') return `Sync error: ${status.message}`;
  if (status.phase === 'synced') return `Synced (pulled ${status.pulled}, pushed ${status.pushed})`;
  return 'Idle';
}

export function SyncStatusBadge() {
  const [status, setStatus] = useState<SyncStatus>({ phase: 'idle' });
  const [pending, setPending] = useState(false);

  useEffect(() => {
    return getBridge().sync.onStatus(setStatus);
  }, []);

  async function handleSyncNow() {
    setPending(true);
    await getBridge().sync.now();
    setPending(false);
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <span>{describe(status)}</span>
      <button type="button" onClick={handleSyncNow} disabled={pending}>
        Sync now
      </button>
    </div>
  );
}
