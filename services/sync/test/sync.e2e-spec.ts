import { randomUUID } from 'crypto';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Test } from '@nestjs/testing';
import { AuthModule } from '@pee/auth';
import { PrismaModule, PrismaService } from '@pee/database';
import { PlanningModule } from '@pee/planning';
import { ProjectsModule } from '@pee/projects';
import request from 'supertest';
import { SyncModule } from '../src/sync.module';

/**
 * Requires a real Postgres reachable via DATABASE_URL (see
 * infrastructure/docker/docker-compose.dev.yml) with migrations applied.
 * Run via `npm run test:e2e` in this workspace, not the default `test` script.
 *
 * This is the flagship proof of the exit criteria: a real SQLite<->Postgres sync protocol,
 * designed and working. It proves the server half against a real Postgres; the SQLite half
 * is proven separately in @pee/local-client's own sync-roundtrip.e2e-spec.ts.
 */
describe('Sync protocol (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let projectId: string;

  const credentials = { email: 'sync-flow@test.com', password: 'super-secret-1', displayName: 'Sync Tester' };

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
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.executionEvent.deleteMany();
    await prisma.taskExecutionSession.deleteMany();
    await prisma.task.deleteMany();
    await prisma.goal.deleteMany();
    await prisma.project.deleteMany();
    await prisma.authAuditLog.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();

    const server = app.getHttpServer();
    await request(server).post('/auth/register').send(credentials).expect(201);
    const loginRes = await request(server)
      .post('/auth/login')
      .send({ email: credentials.email, password: credentials.password })
      .expect(200);
    accessToken = loginRes.body.tokens.accessToken;

    const project = await request(server)
      .post('/projects')
      .set('Authorization', auth())
      .send({ name: 'Website Relaunch' })
      .expect(201);
    projectId = project.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  const auth = () => `Bearer ${accessToken}`;

  it('pulls existing rows, then reflects an offline-created row after push', async () => {
    const server = app.getHttpServer();

    const firstPull = await request(server).post('/sync/pull').set('Authorization', auth()).send({}).expect(200);
    expect(firstPull.body.changes.map((c: any) => c.entity)).toContain('project');
    const cursor = firstPull.body.cursor;

    const offlineGoalId = randomUUID();
    const offlineCreatedAt = new Date().toISOString();
    const pushRes = await request(server)
      .post('/sync/push')
      .set('Authorization', auth())
      .send({
        changes: [
          {
            entity: 'goal',
            id: offlineGoalId,
            data: { projectId, title: 'Offline-created goal' },
            clientUpdatedAt: offlineCreatedAt,
            clientVersion: 1,
          },
        ],
      })
      .expect(200);
    expect(pushRes.body.results[0]).toEqual({ entity: 'goal', id: offlineGoalId, status: 'applied' });

    const goal = await request(server).get(`/goals/${offlineGoalId}`).set('Authorization', auth()).expect(200);
    expect(goal.body.title).toBe('Offline-created goal');

    const secondPull = await request(server)
      .post('/sync/pull')
      .set('Authorization', auth())
      .send({ since: cursor })
      .expect(200);
    const goalChange = secondPull.body.changes.find((c: any) => c.id === offlineGoalId);
    expect(goalChange).toBeDefined();
    expect(goalChange.data.title).toBe('Offline-created goal');
  });

  it('applies a stale-version push when the client edit is the newer wall-clock write (last-write-wins)', async () => {
    const server = app.getHttpServer();
    const goal = await request(server)
      .post(`/projects/${projectId}/goals`)
      .set('Authorization', auth())
      .send({ title: 'Original title' })
      .expect(201);

    // Server edit happens "first" (bumps version to 2).
    await request(server)
      .patch(`/goals/${goal.body.id}`)
      .set('Authorization', auth())
      .send({ title: 'Server edit' })
      .expect(200);

    const futureTimestamp = new Date(Date.now() + 60_000).toISOString();
    const pushRes = await request(server)
      .post('/sync/push')
      .set('Authorization', auth())
      .send({
        changes: [
          {
            entity: 'goal',
            id: goal.body.id,
            data: { title: 'Offline edit made earlier, synced later, but wall-clock newer' },
            clientUpdatedAt: futureTimestamp,
            clientVersion: 1, // stale — client never saw the server edit
          },
        ],
      })
      .expect(200);

    expect(pushRes.body.results[0].status).toBe('applied');
    const goalAfter = await request(server).get(`/goals/${goal.body.id}`).set('Authorization', auth()).expect(200);
    expect(goalAfter.body.title).toBe('Offline edit made earlier, synced later, but wall-clock newer');
  });

  it('returns a conflict with the server record when the server edit is the newer wall-clock write', async () => {
    const server = app.getHttpServer();
    const goal = await request(server)
      .post(`/projects/${projectId}/goals`)
      .set('Authorization', auth())
      .send({ title: 'Original title' })
      .expect(201);

    await request(server)
      .patch(`/goals/${goal.body.id}`)
      .set('Authorization', auth())
      .send({ title: 'Server edit' })
      .expect(200);

    const pastTimestamp = new Date(Date.now() - 60_000).toISOString();
    const pushRes = await request(server)
      .post('/sync/push')
      .set('Authorization', auth())
      .send({
        changes: [
          {
            entity: 'goal',
            id: goal.body.id,
            data: { title: 'Stale offline edit' },
            clientUpdatedAt: pastTimestamp,
            clientVersion: 1,
          },
        ],
      })
      .expect(200);

    expect(pushRes.body.results[0].status).toBe('conflict');
    expect(pushRes.body.results[0].serverRecord.data.title).toBe('Server edit');

    const goalAfter = await request(server).get(`/goals/${goal.body.id}`).set('Authorization', auth()).expect(200);
    expect(goalAfter.body.title).toBe('Server edit');
  });

  it('rejects unauthenticated access', async () => {
    await request(app.getHttpServer()).post('/sync/pull').send({}).expect(401);
  });
});
