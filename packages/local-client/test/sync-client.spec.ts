import { LocalStore } from '../src/local-store';
import { SyncClient } from '../src/sync-client';
import { provisionSqliteFile } from './test-db';

function jsonResponse(body: unknown): Response {
  return { ok: true, status: 200, json: async () => body } as unknown as Response;
}

describe('SyncClient', () => {
  let cleanup: () => void;
  let store: LocalStore;
  const ownerId = 'owner-1';

  beforeAll(() => {
    const provisioned = provisionSqliteFile();
    cleanup = provisioned.cleanup;
    store = new LocalStore(provisioned.databaseUrl);
  });

  afterAll(async () => {
    await store.close();
    cleanup();
  });

  function client(fetchImpl: jest.Mock): SyncClient {
    return new SyncClient(store, { baseUrl: 'https://api.test', getAccessToken: () => 'token', fetchImpl: fetchImpl as any });
  }

  it('does not call the network when the outbox is empty', async () => {
    const fetchImpl = jest.fn();
    const result = await client(fetchImpl).push();
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(result).toEqual({ results: [] });
  });

  it('pulls changes into the local store and advances the cursor', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(
      jsonResponse({
        changes: [
          {
            entity: 'project',
            id: 'remote-1',
            ownerId,
            data: { name: 'Pulled project', description: null, status: 'ACTIVE' },
            updatedAt: '2026-02-01T00:00:00.000Z',
            version: 1,
          },
        ],
        cursor: '2026-02-01T00:00:00.000Z',
        hasMore: false,
      }),
    );

    const result = await client(fetchImpl).pull();

    expect(result).toEqual({ pulled: 1, hasMore: false });
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.test/sync/pull',
      expect.objectContaining({ method: 'POST' }),
    );
    const row = await store.db.localProject.findUnique({ where: { id: 'remote-1' } });
    expect(row?.name).toBe('Pulled project');
    expect(await store.getCursor('all')).toBe('2026-02-01T00:00:00.000Z');
  });

  it('drains multiple pages via pullUntilCaughtUp', async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse({ changes: [], cursor: 'c1', hasMore: true }))
      .mockResolvedValueOnce(jsonResponse({ changes: [], cursor: 'c2', hasMore: true }))
      .mockResolvedValueOnce(jsonResponse({ changes: [], cursor: 'c3', hasMore: false }));

    const total = await client(fetchImpl).pullUntilCaughtUp();

    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(total).toBe(0);
    expect(await store.getCursor('all')).toBe('c3');
  });

  it('collapses repeat local edits into one pushed change and clears the outbox on success', async () => {
    const project = await store.createProject(ownerId, { name: 'Draft' });
    await store.updateProject(project.id, { name: 'Final' });

    const fetchImpl = jest.fn().mockResolvedValue(
      jsonResponse({ results: [{ entity: 'project', id: project.id, status: 'applied' }] }),
    );

    await client(fetchImpl).push();

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [, requestInit] = fetchImpl.mock.calls[0];
    const body = JSON.parse(requestInit.body);
    expect(body.changes).toHaveLength(1);
    expect(body.changes[0].data.name).toBe('Final');

    const pending = await store.listPendingOutbox();
    expect(pending.filter((e) => e.recordId === project.id)).toHaveLength(0);
  });

  it('overwrites the local row and clears the outbox when the server wins a conflict', async () => {
    const project = await store.createProject(ownerId, { name: 'Local edit' });
    const serverRecord = {
      entity: 'project' as const,
      id: project.id,
      ownerId,
      data: { name: 'Server edit wins', description: null, status: 'ACTIVE' },
      updatedAt: '2026-03-01T00:00:00.000Z',
      version: 9,
    };
    const fetchImpl = jest.fn().mockResolvedValue(
      jsonResponse({ results: [{ entity: 'project', id: project.id, status: 'conflict', serverRecord }] }),
    );

    await client(fetchImpl).push();

    const row = await store.db.localProject.findUnique({ where: { id: project.id } });
    expect(row?.name).toBe('Server edit wins');
    expect(row?.version).toBe(9);
    const pending = await store.listPendingOutbox();
    expect(pending.some((e) => e.recordId === project.id)).toBe(false);
  });

  it('leaves a rejected change in the outbox', async () => {
    const project = await store.createProject(ownerId, { name: 'Will be rejected' });
    const fetchImpl = jest.fn().mockResolvedValue(
      jsonResponse({ results: [{ entity: 'project', id: project.id, status: 'rejected', reason: 'invalid_payload' }] }),
    );

    await client(fetchImpl).push();

    const pending = await store.listPendingOutbox();
    expect(pending.some((e) => e.recordId === project.id)).toBe(true);
  });

  it('throws when the server responds with a non-2xx status', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({ ok: false, status: 500 } as unknown as Response);
    await expect(client(fetchImpl).pull()).rejects.toThrow('failed with status 500');
  });
});
