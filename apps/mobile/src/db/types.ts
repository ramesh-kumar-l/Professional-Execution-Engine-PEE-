import { SyncableEntityName } from '@pee/types';

// Field shapes mirror packages/local-client/src/local-store.ts's LocalProjectFields/
// LocalGoalFields/LocalTaskFields exactly — not imported from there directly, since that package
// pulls in a generated Prisma client with a native query-engine binary this runtime can't load.
export interface LocalProjectFields {
  name: string;
  description?: string | null;
  status?: string;
}

export interface LocalGoalFields {
  projectId: string;
  title: string;
  description?: string | null;
  targetDate?: Date | null;
  status?: string;
}

export interface LocalTaskFields {
  goalId: string;
  title: string;
  description?: string | null;
  order?: number;
  status?: string;
}

export interface LocalProjectRow {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  status: string;
  updatedAt: string;
  version: number;
}

export interface LocalGoalRow {
  id: string;
  ownerId: string;
  projectId: string;
  title: string;
  description: string | null;
  targetDate: string | null;
  status: string;
  updatedAt: string;
  version: number;
}

export interface LocalTaskRow {
  id: string;
  ownerId: string;
  goalId: string;
  title: string;
  description: string | null;
  order: number;
  status: string;
  updatedAt: string;
  version: number;
}

export interface PendingOutboxEntry {
  id: string;
  entity: SyncableEntityName;
  recordId: string;
}
