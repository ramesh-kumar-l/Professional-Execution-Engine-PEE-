import { execFileSync } from 'child_process';
import { existsSync, mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';

/**
 * Provisions a fresh, throwaway SQLite file for one test file via `prisma db push` — the
 * SQLite-side equivalent of a real local client's first-run schema setup. No migration history
 * is needed for a single local file (unlike the Postgres side's carried-forward migration gap).
 */
export function provisionSqliteFile(): { databaseUrl: string; cleanup: () => void } {
  const dir = mkdtempSync(path.join(tmpdir(), 'pee-local-client-'));
  const dbPath = path.join(dir, 'local.db');
  const databaseUrl = `file:${dbPath}`;
  const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');

  // `shell: true` is required for npx's .cmd shim to resolve on Windows; every arg here is a
  // static, hardcoded path (no user input), so shell interpolation carries no injection risk.
  execFileSync('npx', ['prisma', 'db', 'push', `--schema=${schemaPath}`, '--skip-generate', '--accept-data-loss'], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, LOCAL_DATABASE_URL: databaseUrl },
    stdio: 'pipe',
    shell: true,
  });

  return {
    databaseUrl,
    cleanup: () => {
      if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
    },
  };
}
