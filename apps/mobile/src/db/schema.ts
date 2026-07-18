// Mirrors packages/local-client/prisma/schema.prisma field-for-field. Prisma's query engine has
// no Android/iOS binary target, so this is a hand-written SQL port of the same tables rather than
// a generated client — see adr/0008. Dates are stored as ISO-8601 TEXT (sorts lexicographically
// the same as chronologically, matching how packages/local-client compares `updatedAt`).
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS local_projects (
  id TEXT PRIMARY KEY NOT NULL,
  ownerId TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  version INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_local_projects_owner ON local_projects (ownerId);

CREATE TABLE IF NOT EXISTS local_goals (
  id TEXT PRIMARY KEY NOT NULL,
  ownerId TEXT NOT NULL,
  projectId TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  targetDate TEXT,
  status TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  version INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_local_goals_owner ON local_goals (ownerId);
CREATE INDEX IF NOT EXISTS idx_local_goals_project ON local_goals (projectId);

CREATE TABLE IF NOT EXISTS local_tasks (
  id TEXT PRIMARY KEY NOT NULL,
  ownerId TEXT NOT NULL,
  goalId TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  "order" INTEGER NOT NULL,
  status TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  version INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_local_tasks_owner ON local_tasks (ownerId);
CREATE INDEX IF NOT EXISTS idx_local_tasks_goal ON local_tasks (goalId);

CREATE TABLE IF NOT EXISTS sync_cursors (
  entity TEXT PRIMARY KEY NOT NULL,
  cursor TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sync_outbox_entries (
  id TEXT PRIMARY KEY NOT NULL,
  entity TEXT NOT NULL,
  recordId TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  pushedAt TEXT
);
CREATE INDEX IF NOT EXISTS idx_outbox_entity_pushed ON sync_outbox_entries (entity, pushedAt);
`;
