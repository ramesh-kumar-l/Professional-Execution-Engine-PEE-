import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS, SyncStatus } from '../main/ipc/ipc-channels';

// The only bridge between the sandboxed renderer and the main process — a narrow, typed surface
// (no raw ipcRenderer exposed) per Electron's documented contextIsolation hardening baseline.
const pee = {
  auth: {
    login: (email: string, password: string) => ipcRenderer.invoke(IPC_CHANNELS.authLogin, email, password),
    logout: () => ipcRenderer.invoke(IPC_CHANNELS.authLogout),
    getSession: () => ipcRenderer.invoke(IPC_CHANNELS.authGetSession),
  },
  projects: {
    list: () => ipcRenderer.invoke(IPC_CHANNELS.projectsList),
    create: (fields: { name: string; description?: string }) => ipcRenderer.invoke(IPC_CHANNELS.projectsCreate, fields),
    update: (id: string, fields: Record<string, unknown>) => ipcRenderer.invoke(IPC_CHANNELS.projectsUpdate, id, fields),
  },
  goals: {
    list: (projectId: string) => ipcRenderer.invoke(IPC_CHANNELS.goalsList, projectId),
    create: (fields: { projectId: string; title: string; description?: string }) =>
      ipcRenderer.invoke(IPC_CHANNELS.goalsCreate, fields),
    update: (id: string, fields: Record<string, unknown>) => ipcRenderer.invoke(IPC_CHANNELS.goalsUpdate, id, fields),
  },
  tasks: {
    list: (goalId: string) => ipcRenderer.invoke(IPC_CHANNELS.tasksList, goalId),
    create: (fields: { goalId: string; title: string }) => ipcRenderer.invoke(IPC_CHANNELS.tasksCreate, fields),
    update: (id: string, fields: Record<string, unknown>) => ipcRenderer.invoke(IPC_CHANNELS.tasksUpdate, id, fields),
  },
  sync: {
    now: () => ipcRenderer.invoke(IPC_CHANNELS.syncNow),
    onStatus: (callback: (status: SyncStatus) => void) => {
      const listener = (_event: unknown, status: SyncStatus) => callback(status);
      ipcRenderer.on(IPC_CHANNELS.syncStatusEvent, listener);
      return () => {
        ipcRenderer.removeListener(IPC_CHANNELS.syncStatusEvent, listener);
      };
    },
  },
  execution: {
    start: (taskId: string) => ipcRenderer.invoke(IPC_CHANNELS.executionStart, taskId),
    complete: (taskId: string) => ipcRenderer.invoke(IPC_CHANNELS.executionComplete, taskId),
  },
  ai: {
    generateSuggestions: (goalId: string) => ipcRenderer.invoke(IPC_CHANNELS.aiGenerateSuggestions, goalId),
    getPendingSuggestion: (goalId: string) => ipcRenderer.invoke(IPC_CHANNELS.aiGetPendingSuggestion, goalId),
    acceptRecommendation: (id: string, acceptedIndices: number[]) =>
      ipcRenderer.invoke(IPC_CHANNELS.aiAcceptRecommendation, id, acceptedIndices),
    dismissRecommendation: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.aiDismissRecommendation, id),
  },
  analytics: {
    getSummary: () => ipcRenderer.invoke(IPC_CHANNELS.analyticsGetSummary),
    getVelocity: (days?: number) => ipcRenderer.invoke(IPC_CHANNELS.analyticsGetVelocity, days),
    getTimeTracking: (groupBy?: 'goal' | 'project') => ipcRenderer.invoke(IPC_CHANNELS.analyticsGetTimeTracking, groupBy),
  },
};

export type PeeBridge = typeof pee;

contextBridge.exposeInMainWorld('pee', pee);
