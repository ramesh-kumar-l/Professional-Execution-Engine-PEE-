import { ProjectSyncFieldsDto } from '../src/dto/entity-payloads/project-sync-fields.dto';
import { SyncEntityRegistryService } from '../src/sync-entity-registry.service';
import { SyncPushService } from '../src/push/sync-push.service';

describe('SyncPushService', () => {
  const ownerId = 'owner-1';
  const rowId = 'proj-1';
  const existing = {
    id: rowId,
    ownerId,
    name: 'Website Relaunch',
    description: null,
    status: 'ACTIVE',
    updatedAt: new Date('2026-01-05T00:00:00Z'),
    version: 2,
  };

  let registry: jest.Mocked<any>;
  let projectEntity: any;
  let service: SyncPushService;

  beforeEach(() => {
    projectEntity = {
      name: 'project',
      delegate: {
        findUnique: jest.fn(),
        updateMany: jest.fn(),
      },
      payloadClass: ProjectSyncFieldsDto,
      applyCreate: jest.fn(),
      applyUpdate: jest.fn(),
      toChangeRecord: (row: any) => ({
        entity: 'project',
        id: row.id,
        ownerId: row.ownerId,
        data: { name: row.name },
        updatedAt: row.updatedAt.toISOString(),
        version: row.version,
      }),
    };
    registry = { find: jest.fn((name: string) => (name === 'project' ? projectEntity : undefined)) };
    service = new SyncPushService(registry as unknown as SyncEntityRegistryService);
  });

  function change(overrides: Record<string, unknown> = {}): any {
    return {
      entity: 'project',
      id: rowId,
      data: { name: 'Synced name' },
      clientUpdatedAt: '2026-01-06T00:00:00.000Z',
      clientVersion: 2,
      ...overrides,
    };
  }

  it('rejects an unregistered entity', async () => {
    const result = await service.push(ownerId, { changes: [change({ entity: 'unknown' })] });
    expect(result.results[0]).toEqual({ entity: 'unknown', id: rowId, status: 'rejected', reason: 'unknown_entity' });
  });

  it('rejects a payload that fails validation', async () => {
    const result = await service.push(ownerId, { changes: [change({ data: { name: 123 } })] });
    expect(result.results[0]).toEqual({ entity: 'project', id: rowId, status: 'rejected', reason: 'invalid_payload' });
  });

  it('creates the row when it does not yet exist, passing through the client id', async () => {
    projectEntity.delegate.findUnique.mockResolvedValue(null);

    const result = await service.push(ownerId, { changes: [change({ data: { name: 'Brand new' } })] });

    expect(projectEntity.applyCreate).toHaveBeenCalledWith(
      ownerId,
      rowId,
      expect.objectContaining({ name: 'Brand new' }),
      new Date('2026-01-06T00:00:00.000Z'),
    );
    expect(result.results[0]).toEqual({ entity: 'project', id: rowId, status: 'applied' });
  });

  it('rejects a create when the domain service throws (e.g. missing parent)', async () => {
    projectEntity.delegate.findUnique.mockResolvedValue(null);
    projectEntity.applyCreate.mockRejectedValue(new Error('Project not found'));

    const result = await service.push(ownerId, { changes: [change()] });

    expect(result.results[0]).toEqual({ entity: 'project', id: rowId, status: 'rejected', reason: 'Project not found' });
  });

  it('rejects a change targeting a row owned by someone else, without leaking its existence', async () => {
    projectEntity.delegate.findUnique.mockResolvedValue({ ...existing, ownerId: 'someone-else' });

    const result = await service.push(ownerId, { changes: [change()] });

    expect(result.results[0]).toEqual({ entity: 'project', id: rowId, status: 'rejected', reason: 'not_found' });
    expect(projectEntity.applyUpdate).not.toHaveBeenCalled();
  });

  it('applies the update when versions match and the optimistic-lock guard succeeds', async () => {
    projectEntity.delegate.findUnique.mockResolvedValue(existing);
    projectEntity.delegate.updateMany.mockResolvedValue({ count: 1 });

    const result = await service.push(ownerId, { changes: [change({ clientVersion: existing.version })] });

    expect(projectEntity.delegate.updateMany).toHaveBeenCalledWith({
      where: { id: rowId, ownerId, version: existing.version },
      data: { version: { increment: 1 } },
    });
    expect(projectEntity.applyUpdate).toHaveBeenCalledWith(
      ownerId,
      rowId,
      expect.objectContaining({ name: 'Synced name' }),
      new Date('2026-01-06T00:00:00.000Z'),
    );
    expect(result.results[0]).toEqual({ entity: 'project', id: rowId, status: 'applied' });
  });

  it('resolves a stale clientVersion by last-write-wins when the client edit is newer', async () => {
    // clientVersion is behind (existing.version=2 but client thinks it's 1) yet the client's wall-clock
    // edit is still newer than the server's current updatedAt, so the client should win.
    const fresh = { ...existing, version: 3, updatedAt: new Date('2026-01-04T00:00:00Z') };
    projectEntity.delegate.findUnique.mockResolvedValueOnce(existing).mockResolvedValueOnce(fresh);
    projectEntity.delegate.updateMany.mockResolvedValue({ count: 1 });

    const result = await service.push(
      ownerId,
      { changes: [change({ clientVersion: 1, clientUpdatedAt: '2026-01-06T00:00:00.000Z' })] },
    );

    expect(projectEntity.delegate.updateMany).toHaveBeenCalledWith({
      where: { id: rowId, ownerId, version: fresh.version },
      data: { version: { increment: 1 } },
    });
    expect(projectEntity.applyUpdate).toHaveBeenCalled();
    expect(result.results[0].status).toBe('applied');
  });

  it('returns a conflict with the server record when the server edit is newer', async () => {
    const fresh = { ...existing, version: 3, updatedAt: new Date('2026-01-10T00:00:00Z') };
    projectEntity.delegate.findUnique.mockResolvedValueOnce(existing).mockResolvedValueOnce(fresh);

    const result = await service.push(
      ownerId,
      { changes: [change({ clientVersion: 1, clientUpdatedAt: '2026-01-06T00:00:00.000Z' })] },
    );

    expect(projectEntity.applyUpdate).not.toHaveBeenCalled();
    expect(result.results[0]).toEqual({
      entity: 'project',
      id: rowId,
      status: 'conflict',
      serverRecord: projectEntity.toChangeRecord(fresh),
    });
  });

  it('treats a lost optimistic-lock race (matching versions but guard miss) as a conflict re-check', async () => {
    const fresh = { ...existing, version: 3, updatedAt: new Date('2026-01-10T00:00:00Z') };
    projectEntity.delegate.findUnique.mockResolvedValueOnce(existing).mockResolvedValueOnce(fresh);
    projectEntity.delegate.updateMany.mockResolvedValue({ count: 0 });

    const result = await service.push(ownerId, { changes: [change({ clientVersion: existing.version })] });

    expect(result.results[0].status).toBe('conflict');
  });
});
