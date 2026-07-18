import { AddressInfo } from 'net';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Test } from '@nestjs/testing';
import { AuthModule } from '@pee/auth';
import { PrismaModule, PrismaService } from '@pee/database';
import { PlanningModule } from '@pee/planning';
import { ProjectsModule } from '@pee/projects';
import { SyncModule } from '@pee/sync';
import request from 'supertest';
import { LocalStore } from '../src/local-store';
import { SyncClient } from '../src/sync-client';
import { provisionSqliteFile } from './test-db';

/**
 * The flagship proof of Phase 5's exit criteria: a real SQLite local store, syncing against a
 * real Postgres-backed server, over the actual HTTP sync protocol — not mocks on either side.
 * Requires DATABASE_URL (Postgres, see infrastructure/docker) — same carried-forward sandbox
 * limitation as every other e2e spec in this repo. The SQLite half needs no infra at all.
 */
describe('Sync round-trip: SQLite local client <-> Postgres server (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let baseUrl: string;
  let accessToken: string;
  let projectId: string;
  let cleanupSqlite: () => void;
  let store: LocalStore;
  let client: SyncClient;

  const credentials = { email: 'sync-roundtrip@test.com', password: 'super-secret-1', displayName: 'Roundtrip Tester' };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        EventEmitterModule.forRoot(),
        PrismaModule,
        AuthModule,
        ProjectsModule,
        PlanningModule,
        SyncModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
    await app.init();
    await app.listen(0);
    const address = app.getHttpServer().address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
    prisma = app.get(PrismaService);

    const provisioned = provisionSqliteFile();
    cleanupSqlite = provisioned.cleanup;
    store = new LocalStore(provisioned.databaseUrl);
  });

  beforeEach(async () => {
    await prisma.task.deleteMany();
    await prisma.goal.deleteMany();
    await prisma.project.deleteMany();
    await prisma.authAuditLog.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();

    await request(app.getHttpServer()).post('/auth/register').send(credentials).expect(201);
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: credentials.email, password: credentials.password })
      .expect(200);
    accessToken = loginRes.body.tokens.accessToken;
    client = new SyncClient(store, { baseUrl, getAccessToken: () => accessToken });

    const project = await request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Website Relaunch' })
      .expect(201);
    projectId = project.body.id;
  });

  afterAll(async () => {
    await store.close();
    cleanupSqlite();
    await app.close();
  });

  it('pulls server-created rows into the local SQLite store', async () => {
    await client.pullUntilCaughtUp();

    const localProject = await store.db.localProject.findUnique({ where: { id: projectId } });
    expect(localProject?.name).toBe('Website Relaunch');
  });

  it('pushes an offline-created goal to Postgres, with rollup/event side effects intact', async () => {
    await client.pullUntilCaughtUp();

    const goal = await store.createGoal('owner-placeholder', { projectId, title: 'Offline goal' });
    await client.push();

    const serverGoal = await request(app.getHttpServer())
      .get(`/goals/${goal.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(serverGoal.body.title).toBe('Offline goal');

    const task = await store.createTask('owner-placeholder', { goalId: goal.id, title: 'Offline task' });
    await store.updateTask(task.id, { status: 'DONE' });
    await client.push();

    const serverGoalAfterTask = await request(app.getHttpServer())
      .get(`/goals/${goal.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(serverGoalAfterTask.body.status).toBe('COMPLETED');
    expect(serverGoalAfterTask.body.progress.percentComplete).toBe(100);

    const activity = await request(app.getHttpServer())
      .get(`/goals/${goal.id}/activity`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(activity.body.data.map((e: { eventType: string }) => e.eventType)).toEqual(
      expect.arrayContaining(['TASK_COMPLETED', 'GOAL_STATUS_CHANGED']),
    );
  });

  it('resolves a concurrent edit on both sides via last-write-wins, then converges on the next pull', async () => {
    await client.pullUntilCaughtUp();
    const goal = await request(app.getHttpServer())
      .post(`/projects/${projectId}/goals`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Shared goal' })
      .expect(201);
    await client.pullUntilCaughtUp();

    // Local edit happens first...
    await store.updateGoal(goal.body.id, { title: 'Edited offline' });
    // ...but the server edit happens before the device ever syncs.
    await request(app.getHttpServer())
      .patch(`/goals/${goal.body.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Edited on server' })
      .expect(200);

    await client.push();
    await client.pullUntilCaughtUp();

    const localGoal = await store.db.localGoal.findUnique({ where: { id: goal.body.id } });
    const serverGoal = await request(app.getHttpServer())
      .get(`/goals/${goal.body.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    // Whichever wall-clock edit was newer wins on the server; the local store converges to match.
    expect(localGoal?.title).toBe(serverGoal.body.title);
  });
});
