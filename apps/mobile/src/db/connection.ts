import { SCHEMA_SQL } from './schema';

/**
 * The subset of expo-sqlite's SQLiteDatabase surface MobileStore actually needs. Declared as an
 * interface (not imported from expo-sqlite directly) so unit tests can supply a plain in-memory
 * double instead of the native module — same "plain-object mock" convention every prior phase's
 * service specs use.
 */
export interface SQLiteExecutor {
  execAsync(source: string): Promise<void>;
  runAsync(source: string, params?: unknown[]): Promise<{ changes: number }>;
  getAllAsync<T>(source: string, params?: unknown[]): Promise<T[]>;
  getFirstAsync<T>(source: string, params?: unknown[]): Promise<T | null>;
}

const DB_NAME = 'pee-local.db';

/** Opens (or creates) the on-device database and ensures the schema exists — safe to call on
 *  every launch since every statement in SCHEMA_SQL is idempotent (IF NOT EXISTS). Wrapped in a
 *  plain object (rather than returning the native SQLiteDatabase directly) so SQLiteExecutor
 *  stays decoupled from expo-sqlite's exact overload signatures. */
export async function openMobileDatabase(): Promise<SQLiteExecutor> {
  const { openDatabaseAsync } = await import('expo-sqlite');
  const db = await openDatabaseAsync(DB_NAME);
  await db.execAsync(SCHEMA_SQL);

  return {
    execAsync: (source) => db.execAsync(source),
    runAsync: async (source, params = []) => {
      const result = await db.runAsync(source, params as never[]);
      return { changes: result.changes };
    },
    getAllAsync: (source, params = []) => db.getAllAsync(source, params as never[]),
    getFirstAsync: (source, params = []) => db.getFirstAsync(source, params as never[]),
  };
}
