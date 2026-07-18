import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Test } from '@nestjs/testing';
import { AuthModule } from '@pee/auth';
import { PrismaModule, PrismaService } from '@pee/database';
import { ProjectsModule } from '@pee/projects';
import request from 'supertest';
import { PlanningModule } from '../src/planning.module';

/**
 * Requires a real Postgres reachable via DATABASE_URL (see
 * infrastructure/docker/docker-compose.dev.yml) with migrations applied.
 * Run via `npm run test:e2e` in this workspace, not the default `test` script.
 */
describe('Planning flow (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let projectId: string;

  const credentials = { email: 'planning-flow@test.com', password: 'super-secret-1', displayName: 'Flow Tester' };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        EventEmitterModule.forRoot(),
        PrismaModule,
        AuthModule,
        ProjectsModule,
        PlanningModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
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

  it('closes the loop: task completion rolls up into goal status and progress', async () => {
    const server = app.getHttpServer();

    const goal = await request(server)
      .post(`/projects/${projectId}/goals`)
      .set('Authorization', auth())
      .send({ title: 'Launch marketing site' })
      .expect(201);
    const goalId = goal.body.id;
    expect(goal.body.status).toBe('NOT_STARTED');
    expect(goal.body.progress).toEqual({ totalTasks: 0, doneTasks: 0, percentComplete: 0 });

    const taskA = await request(server)
      .post(`/goals/${goalId}/tasks`)
      .set('Authorization', auth())
      .send({ title: 'Write copy' })
      .expect(201);
    await request(server)
      .post(`/goals/${goalId}/tasks`)
      .set('Authorization', auth())
      .send({ title: 'Build page' })
      .expect(201);

    let goalState = await request(server).get(`/goals/${goalId}`).set('Authorization', auth()).expect(200);
    expect(goalState.body.status).toBe('NOT_STARTED');

    await request(server)
      .patch(`/tasks/${taskA.body.id}`)
      .set('Authorization', auth())
      .send({ status: 'DONE' })
      .expect(200);

    goalState = await request(server).get(`/goals/${goalId}`).set('Authorization', auth()).expect(200);
    expect(goalState.body.status).toBe('IN_PROGRESS');
    expect(goalState.body.progress).toEqual({ totalTasks: 2, doneTasks: 1, percentComplete: 50 });

    const tasks = await request(server).get(`/goals/${goalId}/tasks`).set('Authorization', auth()).expect(200);
    const remainingTaskId = tasks.body.data.find((t: { id: string }) => t.id !== taskA.body.id).id;

    await request(server)
      .patch(`/tasks/${remainingTaskId}`)
      .set('Authorization', auth())
      .send({ status: 'DONE' })
      .expect(200);

    goalState = await request(server).get(`/goals/${goalId}`).set('Authorization', auth()).expect(200);
    expect(goalState.body.status).toBe('COMPLETED');
    expect(goalState.body.progress.percentComplete).toBe(100);

    await request(server).delete(`/goals/${goalId}`).set('Authorization', auth()).expect(204);
    const listAfterArchive = await request(server)
      .get(`/projects/${projectId}/goals`)
      .set('Authorization', auth())
      .expect(200);
    expect(listAfterArchive.body.data).toHaveLength(0);
  });

  it('rejects unauthenticated access', async () => {
    await request(app.getHttpServer()).get(`/projects/${projectId}/goals`).expect(401);
  });

  it('returns 404 when creating a goal under a project owned by another user', async () => {
    const server = app.getHttpServer();

    await request(server).post('/auth/register').send({
      email: 'other@test.com',
      password: 'super-secret-2',
      displayName: 'Other User',
    }).expect(201);
    const otherLogin = await request(server)
      .post('/auth/login')
      .send({ email: 'other@test.com', password: 'super-secret-2' })
      .expect(200);
    const otherToken = otherLogin.body.tokens.accessToken;

    await request(server)
      .post(`/projects/${projectId}/goals`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ title: 'Should not be allowed' })
      .expect(404);
  });
});
