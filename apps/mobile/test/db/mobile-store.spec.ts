import { SCHEMA_SQL } from '../../src/db/schema';
import { MobileStore } from '../../src/db/mobile-store';
import { createNodeSqliteExecutor } from '../support/node-sqlite-executor';

const closers: Array<() => void> = [];

async function createStore(): Promise<MobileStore> {
  const { executor, close } = createNodeSqliteExecutor();
  closers.push(close);
  await executor.execAsync(SCHEMA_SQL);
  return new MobileStore(executor);
}

describe('MobileStore', () => {
  afterEach(() => {
    closers.splice(0).forEach((close) => close());
  });

  it('creates a project, enqueues an outbox entry, and lists it back', async () => {
    const store = await createStore();
    const project = await store.createProject('owner-1', { name: 'Launch' });

    expect(project.version).toBe(1);
    expect(project.status).toBe('ACTIVE');

    const pending = await store.listPendingOutbox();
    expect(pending).toEqual([{ id: expect.any(String), entity: 'project', recordId: project.id }]);

    const listed = await store.projects.listByOwner('owner-1');
    expect(listed.map((row) => row.id)).toEqual([project.id]);
  });

  it('increments version and enqueues a new outbox entry on update', async () => {
    const store = await createStore();
    const project = await store.createProject('owner-1', { name: 'Launch' });
    const updated = await store.updateProject(project.id, { status: 'ARCHIVED' });

    expect(updated.version).toBe(2);
    expect(updated.status).toBe('ARCHIVED');

    const pending = await store.listPendingOutbox();
    expect(pending).toHaveLength(2);
  });

  it('marks outbox entries pushed and stops listing them as pending', async () => {
    const store = await createStore();
    const project = await store.createProject('owner-1', { name: 'Launch' });
    const [entry] = await store.listPendingOutbox();

    await store.markOutboxPushed(entry.id);

    expect(await store.listPendingOutbox()).toEqual([]);
    expect(await store.projects.getById(project.id)).not.toBeNull();
  });

  it('applies an incoming project change (insert then update) without touching the outbox', async () => {
    const store = await createStore();
    await store.applyServerChange({
      entity: 'project',
      id: 'server-1',
      ownerId: 'owner-1',
      data: { name: 'From server', description: null, status: 'ACTIVE' },
      updatedAt: new Date('2026-01-01T00:00:00.000Z').toISOString(),
      version: 1,
    });
    expect(await store.listPendingOutbox()).toEqual([]);

    await store.applyServerChange({
      entity: 'project',
      id: 'server-1',
      ownerId: 'owner-1',
      data: { name: 'Renamed', description: null, status: 'ACTIVE' },
      updatedAt: new Date('2026-01-02T00:00:00.000Z').toISOString(),
      version: 2,
    });

    const row = await store.projects.getById('server-1');
    expect(row?.name).toBe('Renamed');
    expect(row?.version).toBe(2);
    expect(await store.listPendingOutbox()).toEqual([]);
  });

  it('round-trips goals and tasks scoped to their parent', async () => {
    const store = await createStore();
    const project = await store.createProject('owner-1', { name: 'Launch' });
    const goal = await store.createGoal('owner-1', { projectId: project.id, title: 'Ship v1' });
    await store.createTask('owner-1', { goalId: goal.id, title: 'Write tests' });

    const goals = await store.goals.listByProject(project.id);
    const tasks = await store.tasks.listByGoal(goal.id);

    expect(goals).toHaveLength(1);
    expect(tasks).toHaveLength(1);
    expect(tasks[0].status).toBe('TODO');
  });

  it('tracks a sync cursor per entity', async () => {
    const store = await createStore();
    expect(await store.getCursor('all')).toBeUndefined();
    await store.setCursor('all', 'cursor-1');
    expect(await store.getCursor('all')).toBe('cursor-1');
    await store.setCursor('all', 'cursor-2');
    expect(await store.getCursor('all')).toBe('cursor-2');
  });
});
