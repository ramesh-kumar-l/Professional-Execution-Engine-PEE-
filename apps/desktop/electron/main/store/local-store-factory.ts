import { execFileSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';
import { app } from 'electron';
import { LocalStore } from '@pee/local-client';

let store: LocalStore | undefined;

function resolveSchemaPath(): string {
  return path.join(path.dirname(require.resolve('@pee/local-client/package.json')), 'prisma', 'schema.prisma');
}

function resolveDbPath(): string {
  return path.join(app.getPath('userData'), 'pee-local.db');
}

/**
 * First-run schema bootstrap. There is no migration history for the SQLite side (same
 * carried-forward gap as the Postgres side across every phase), so a brand-new local db is
 * brought up to date with `prisma db push` — the exact approach @pee/local-client's own test
 * fixture (test/test-db.ts) already uses for a throwaway SQLite file.
 */
function ensureSchema(databaseUrl: string): void {
  // `shell: true` is required for npx's .cmd shim to resolve on Windows; every arg is a
  // static, hardcoded path (no user input), so shell interpolation carries no injection risk.
  execFileSync('npx', ['prisma', 'db', 'push', `--schema=${resolveSchemaPath()}`, '--skip-generate', '--accept-data-loss'], {
    cwd: path.dirname(resolveSchemaPath()),
    env: { ...process.env, LOCAL_DATABASE_URL: databaseUrl },
    stdio: 'pipe',
    shell: true,
  });
}

export function getLocalStore(): LocalStore {
  if (store) return store;

  const dbPath = resolveDbPath();
  const databaseUrl = `file:${dbPath}`;
  if (!existsSync(dbPath)) {
    ensureSchema(databaseUrl);
  }

  store = new LocalStore(databaseUrl);
  return store;
}

export async function closeLocalStore(): Promise<void> {
  if (!store) return;
  await store.close();
  store = undefined;
}
