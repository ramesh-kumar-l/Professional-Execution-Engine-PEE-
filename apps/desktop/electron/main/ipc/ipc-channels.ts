// Single source of truth for IPC channel names, shared by every ipc/*.ts handler module, the
// preload bridge, and (via type-only import) the renderer's window.pee typings. Keeping every
// channel name here — rather than inlined string literals scattered across files — is what lets
// preload.ts expose a narrow, typed surface instead of a raw ipcRenderer passthrough.
export const IPC_CHANNELS = {
  authLogin: 'auth:login',
  authLogout: 'auth:logout',
  authGetSession: 'auth:getSession',

  projectsList: 'projects:list',
  projectsCreate: 'projects:create',
  projectsUpdate: 'projects:update',

  goalsList: 'goals:list',
  goalsCreate: 'goals:create',
  goalsUpdate: 'goals:update',

  tasksList: 'tasks:list',
  tasksCreate: 'tasks:create',
  tasksUpdate: 'tasks:update',

  syncNow: 'sync:now',
  syncStatusEvent: 'sync:status',

  executionStart: 'execution:start',
  executionComplete: 'execution:complete',

  aiGenerateSuggestions: 'ai:generateSuggestions',
  aiGetPendingSuggestion: 'ai:getPendingSuggestion',
  aiAcceptRecommendation: 'ai:acceptRecommendation',
  aiDismissRecommendation: 'ai:dismissRecommendation',

  analyticsGetSummary: 'analytics:getSummary',
  analyticsGetVelocity: 'analytics:getVelocity',
  analyticsGetTimeTracking: 'analytics:getTimeTracking',
} as const;

export type SyncStatus =
  | { phase: 'idle' }
  | { phase: 'syncing' }
  | { phase: 'synced'; at: string; pulled: number; pushed: number }
  | { phase: 'error'; message: string };
