import { SCHEMA_SQL } from '../../src/db/schema';
import { MobileStore } from '../../src/db/mobile-store';
import { MobileSyncClient } from '../../src/db/mobile-sync-client';
import { createNodeSqliteExecutor } from '../support/node-sqlite-executor';

const closers: Array<() => void> = [];

async function createStore(): Promise<MobileStore> {
  const { executor, close } = createNodeSqliteExecutor();
  closers.push(close);
  await executor.execAsync(SCHEMA_SQL);
  return new MobileStore(executor);
}

function jsonResponse(body: unknown, ok = true): Response {
  return { ok, status: ok ? 200 : 500, json: async () => body } as Response;
}

describe('MobileSyncClient', () => {
  afterEach(() => {
    closers.splice(0).forEach((close) => close());
  });

  it('pulls changes, applies them, and advances the cursor', async () => {
    const store = await createStore();
    const fetchImpl = jest.fn().mockResolvedValue(
      jsonResponse({
        changes: [
          {
            entity: 'project',
            id: 'server-1',
            ownerId: 'owner-1',
            data: { name: 'From server', description: null, status: 'ACTIVE' },
            updatedAt: '2026-01-01T00:00:00.000Z',
            version: 1,
          },
        ],
        cursor: 'cursor-1',
        hasMore: false,
      }),
    );
    const client = new MobileSyncClient(store, { baseUrl: 'https://api.test', getAccessToken: () => 'token', fetchImpl });

    const { pulled, hasMore } = await client.pull();

    expect(pulled).toBe(1);
    expect(hasMore).toBe(false);
    expect(await store.getCursor('all')).toBe('cursor-1');
    expect(await store.projects.getById('server-1')).not.toBeNull();
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.test/sync/pull',
      expect.objectContaining({ method: 'POST', headers: expect.objectContaining({ Authorization: 'Bearer token' }) }),
    );
  });

  it('collapses repeat edits to the same record into one pushed change', async () => {
    const store = await createStore();
    const project = await store.createProject('owner-1', { name: 'Launch' });
    await store.updateProject(project.id, { status: 'ARCHIVED' });

    const fetchImpl = jest.fn().mockResolvedValue(jsonResponse({ results: [{ status: 'applied' }] }));
    const client = new MobileSyncClient(store, { baseUrl: 'https://api.test', getAccessToken: () => 'token', fetchImpl });

    await client.push();

    const [, options] = fetchImpl.mock.calls[0];
    const body = JSON.parse(options.body as string);
    expect(body.changes).toHaveLength(1);
    expect(body.changes[0]).toMatchObject({ entity: 'project', id: project.id, data: { status: 'ARCHIVED' } });
    expect(await store.listPendingOutbox()).toEqual([]);
  });

  it('applies the server record on conflict and still clears the outbox entry', async () => {
    const store = await createStore();
    const project = await store.createProject('owner-1', { name: 'Launch' });
    const fetchImpl = jest.fn().mockResolvedValue(
      jsonResponse({
        results: [
          {
            status: 'conflict',
            serverRecord: {
              entity: 'project',
              id: project.id,
              ownerId: 'owner-1',
              data: { name: 'Server won', description: null, status: 'ACTIVE' },
              updatedAt: '2026-02-01T00:00:00.000Z',
              version: 5,
            },
          },
        ],
      }),
    );
    const client = new MobileSyncClient(store, { baseUrl: 'https://api.test', getAccessToken: () => 'token', fetchImpl });

    await client.push();

    const row = await store.projects.getById(project.id);
    expect(row?.name).toBe('Server won');
    expect(row?.version).toBe(5);
    expect(await store.listPendingOutbox()).toEqual([]);
  });

  it('throws when the pull request fails', async () => {
    const store = await createStore();
    const fetchImpl = jest.fn().mockResolvedValue(jsonResponse({}, false));
    const client = new MobileSyncClient(store, { baseUrl: 'https://api.test', getAccessToken: () => 'token', fetchImpl });

    await expect(client.pull()).rejects.toThrow('Sync request to /sync/pull failed with status 500');
  });
});
