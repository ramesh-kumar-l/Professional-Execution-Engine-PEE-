export type SyncableEntityName = 'project' | 'goal' | 'task';

export interface SyncChangeRecord {
  entity: SyncableEntityName;
  id: string;
  ownerId: string;
  data: Record<string, unknown>;
  updatedAt: string;
  version: number;
}

export interface SyncPullQuery {
  since?: string;
}

export interface SyncPullResponse {
  changes: SyncChangeRecord[];
  cursor: string;
  hasMore: boolean;
}

export interface SyncPushChange {
  entity: SyncableEntityName;
  id: string;
  data: Record<string, unknown>;
  clientUpdatedAt: string;
  clientVersion: number;
}

export interface SyncPushRequest {
  changes: SyncPushChange[];
}

export type SyncPushStatus = 'applied' | 'conflict' | 'rejected';

export interface SyncPushResult {
  entity: SyncableEntityName;
  id: string;
  status: SyncPushStatus;
  serverRecord?: SyncChangeRecord;
  reason?: string;
}

export interface SyncPushResponse {
  results: SyncPushResult[];
}
