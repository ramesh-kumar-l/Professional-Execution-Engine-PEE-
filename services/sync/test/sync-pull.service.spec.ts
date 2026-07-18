import { SyncEntityRegistryService } from '../src/sync-entity-registry.service';
import { SyncPullService } from '../src/pull/sync-pull.service';

describe('SyncPullService', () => {
  const ownerId = 'owner-1';
  const project = {
    id: 'proj-1',
    ownerId,
    name: 'Website Relaunch',
    description: null,
    status: 'ACTIVE',
    updatedAt: new Date('2026-01-05T00:00:00Z'),
    version: 2,
  };
  const goal = {
    id: 'goal-1',
    ownerId,
    projectId: 'proj-1',
    title: 'Ship v2',
    description: null,
    targetDate: null,
    status: 'NOT_STARTED',
    updatedAt: new Date('2026-01-03T00:00:00Z'),
    version: 1,
  };

  let registry: jest.Mocked<any>;
  let service: SyncPullService;

  beforeEach(() => {
    registry = {
      entities: [
        {
          name: 'project',
          delegate: { findMany: jest.fn().mockResolvedValue([project]) },
          toChangeRecord: (row: any) => ({
            entity: 'project',
            id: row.id,
            ownerId: row.ownerId,
            data: { name: row.name },
            updatedAt: row.updatedAt.toISOString(),
            version: row.version,
          }),
        },
        {
          name: 'goal',
          delegate: { findMany: jest.fn().mockResolvedValue([goal]) },
          toChangeRecord: (row: any) => ({
            entity: 'goal',
            id: row.id,
            ownerId: row.ownerId,
            data: { title: row.title },
            updatedAt: row.updatedAt.toISOString(),
            version: row.version,
          }),
        },
        {
          name: 'task',
          delegate: { findMany: jest.fn().mockResolvedValue([]) },
          toChangeRecord: jest.fn(),
        },
      ],
    };
    service = new SyncPullService(registry as unknown as SyncEntityRegistryService);
  });

  it('queries every registered entity scoped to the caller and cursor', async () => {
    await service.pull(ownerId, '2026-01-01T00:00:00.000Z');

    for (const entity of registry.entities) {
      expect(entity.delegate.findMany).toHaveBeenCalledWith({
        where: { ownerId, updatedAt: { gt: new Date('2026-01-01T00:00:00.000Z') } },
        orderBy: { updatedAt: 'asc' },
        take: 500,
      });
    }
  });

  it('merges changes across entities and advances the cursor to the latest updatedAt', async () => {
    const result = await service.pull(ownerId);

    expect(result.changes).toHaveLength(2);
    expect(result.changes.map((c) => c.entity)).toEqual(expect.arrayContaining(['project', 'goal']));
    expect(result.cursor).toBe(project.updatedAt.toISOString());
    expect(result.hasMore).toBe(false);
  });

  it('defaults since to the epoch when no cursor is given', async () => {
    await service.pull(ownerId);
    expect(registry.entities[0].delegate.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { ownerId, updatedAt: { gt: new Date(0) } } }),
    );
  });

  it('flags hasMore when any entity returns a full page', async () => {
    const fullPage = Array.from({ length: 500 }, (_, i) => ({ ...project, id: `proj-${i}` }));
    registry.entities[0].delegate.findMany.mockResolvedValue(fullPage);

    const result = await service.pull(ownerId);

    expect(result.hasMore).toBe(true);
  });

  it('returns an empty changeset with an unchanged cursor when nothing is newer', async () => {
    registry.entities[0].delegate.findMany.mockResolvedValue([]);
    registry.entities[1].delegate.findMany.mockResolvedValue([]);

    const since = '2026-01-01T00:00:00.000Z';
    const result = await service.pull(ownerId, since);

    expect(result.changes).toEqual([]);
    expect(result.cursor).toBe(since);
    expect(result.hasMore).toBe(false);
  });
});
