import { LocalStore } from '../src/local-store';
import { provisionSqliteFile } from './test-db';

describe('LocalStore', () => {
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

  it('creates a project locally and enqueues an outbox entry', async () => {
    const project = await store.createProject(ownerId, { name: 'Website Relaunch' });
    expect(project.id).toBeDefined();
    expect(project.version).toBe(1);

    const pending = await store.listPendingOutbox();
    expect(pending).toEqual([expect.objectContaining({ entity: 'project', recordId: project.id })]);
  });

  it('updates a project, bumping version and enqueuing another outbox entry', async () => {
    const project = await store.createProject(ownerId, { name: 'Original' });
    await store.updateProject(project.id, { name: 'Renamed' });

    const row = await store.db.localProject.findUnique({ where: { id: project.id } });
    expect(row?.name).toBe('Renamed');
    expect(row?.version).toBe(2);

    const pending = await store.listPendingOutbox();
    expect(pending.filter((e) => e.recordId === project.id)).toHaveLength(2);
  });

  it('creates a goal and a task, scoped to their parents', async () => {
    const project = await store.createProject(ownerId, { name: 'Parent project' });
    const goal = await store.createGoal(ownerId, { projectId: project.id, title: 'Ship v2' });
    const task = await store.createTask(ownerId, { goalId: goal.id, title: 'Write copy' });

    expect(goal.projectId).toBe(project.id);
    expect(task.goalId).toBe(goal.id);
  });

  it('marks an outbox entry pushed so it no longer appears as pending', async () => {
    const project = await store.createProject(ownerId, { name: 'Will be pushed' });
    const [entry] = await store.listPendingOutbox().then((all) => all.filter((e) => e.recordId === project.id));

    await store.markOutboxPushed(entry.id);

    const pending = await store.listPendingOutbox();
    expect(pending.some((e) => e.id === entry.id)).toBe(false);
  });

  it('applies an incoming server change without touching the outbox', async () => {
    const beforeCount = (await store.listPendingOutbox()).length;

    await store.applyServerChange({
      entity: 'project',
      id: 'remote-project-1',
      ownerId,
      data: { name: 'From the server', description: null, status: 'ACTIVE' },
      updatedAt: '2026-01-05T00:00:00.000Z',
      version: 3,
    });

    const row = await store.db.localProject.findUnique({ where: { id: 'remote-project-1' } });
    expect(row?.name).toBe('From the server');
    expect(row?.version).toBe(3);

    const afterCount = (await store.listPendingOutbox()).length;
    expect(afterCount).toBe(beforeCount);
  });

  it('tracks a per-entity sync cursor', async () => {
    expect(await store.getCursor('all')).toBeUndefined();
    await store.setCursor('all', '2026-01-01T00:00:00.000Z');
    expect(await store.getCursor('all')).toBe('2026-01-01T00:00:00.000Z');
    await store.setCursor('all', '2026-01-02T00:00:00.000Z');
    expect(await store.getCursor('all')).toBe('2026-01-02T00:00:00.000Z');
  });
});
