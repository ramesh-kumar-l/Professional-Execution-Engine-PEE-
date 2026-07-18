// Mirrors apps/desktop/electron/main/ipc/ipc-channels.ts's SyncStatus union — same shape, no IPC
// boundary to carry it across here, so it's just a plain shared type.
export type SyncStatus =
  | { phase: 'idle' }
  | { phase: 'syncing' }
  | { phase: 'synced'; at: string; pulled: number; pushed: number }
  | { phase: 'error'; message: string };
