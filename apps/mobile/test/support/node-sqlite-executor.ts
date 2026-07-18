import { DatabaseSync } from 'node:sqlite';
import { SQLiteExecutor } from '../../src/db/connection';

/**
 * A real-SQLite-backed test double for SQLiteExecutor, using Node's built-in `node:sqlite`
 * instead of the native expo-sqlite module (which needs a device/simulator). This exercises the
 * actual SQL text in schema.ts/*-repo.ts against real SQLite semantics, not a hand-rolled parser
 * — the same "plain-object mock, but real behavior where it matters" convention this project
 * uses for local-client's Prisma-backed tests.
 */
export function createNodeSqliteExecutor(): { executor: SQLiteExecutor; close: () => void } {
  const db = new DatabaseSync(':memory:');

  const executor: SQLiteExecutor = {
    async execAsync(source: string): Promise<void> {
      db.exec(source);
    },
    async runAsync(source: string, params: unknown[] = []): Promise<{ changes: number }> {
      const result = db.prepare(source).run(...(params as never[]));
      return { changes: Number(result.changes) };
    },
    async getAllAsync<T>(source: string, params: unknown[] = []): Promise<T[]> {
      return db.prepare(source).all(...(params as never[])) as T[];
    },
    async getFirstAsync<T>(source: string, params: unknown[] = []): Promise<T | null> {
      const row = db.prepare(source).get(...(params as never[]));
      return (row as T | undefined) ?? null;
    },
  };

  return { executor, close: () => db.close() };
}
