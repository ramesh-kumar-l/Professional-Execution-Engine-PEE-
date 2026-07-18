import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Test } from '@nestjs/testing';
import { AuthModule } from '@pee/auth';
import { PrismaModule, PrismaService } from '@pee/database';
import { PlanningModule } from '@pee/planning';
import { ProjectsModule } from '@pee/projects';
import request from 'supertest';
import { ExecutionModule } from '../src/execution.module';

/**
 * Requires a real Postgres reachable via DATABASE_URL (see
 * infrastructure/docker/docker-compose.dev.yml) with migrations applied.
 * Run via `npm run test:e2e` in this workspace, not the default `test` script.
 */
describe('Execution flow (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let goalId: string;
  let taskId: string;

  const credentials = { email: 'execution-flow@test.com', password: 'super-secret-1', displayName: 'Flow Tester' };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        EventEmitterModule.forRoot(),
        PrismaModule,
        AuthModule,
        ProjectsModule,
        PlanningModule,
        ExecutionModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
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
    const goal = await request(server)
      .post(`/projects/${project.body.id}/goals`)
      .set('Authorization', auth())
      .send({ title: 'Launch marketing site' })
      .expect(201);
    goalId = goal.body.id;
    const task = await request(server)
      .post(`/goals/${goalId}/tasks`)
      .set('Authorization', auth())
      .send({ title: 'Write copy' })
      .expect(201);
    taskId = task.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  const auth = () => `Bearer ${accessToken}`;

  it('makes the goal-to-task execution loop observable end-to-end', async () => {
    const server = app.getHttpServer();

    let active = await request(server).get('/execution/active').set('Authorization', auth()).expect(200);
    expect(active.body).toHaveLength(0);

    const started = await request(server)
      .post(`/tasks/${taskId}/execution/start`)
      .set('Authorization', auth())
      .expect(201);
    expect(started.body.endedAt).toBeNull();

    const taskAfterStart = await request(server).get(`/tasks/${taskId}`).set('Authorization', auth()).expect(200);
    expect(taskAfterStart.body.status).toBe('IN_PROGRESS');

    active = await request(server).get('/execution/active').set('Authorization', auth()).expect(200);
    expect(active.body).toHaveLength(1);
    expect(active.body[0].taskTitle).toBe('Write copy');
    expect(active.body[0].goalId).toBe(goalId);

    const completed = await request(server)
      .post(`/tasks/${taskId}/execution/complete`)
      .set('Authorization', auth())
      .expect(200);
    expect(completed.body.endedAt).not.toBeNull();
    expect(completed.body.durationSeconds).toBeGreaterThanOrEqual(0);

    const goalAfterComplete = await request(server).get(`/goals/${goalId}`).set('Authorization', auth()).expect(200);
    expect(goalAfterComplete.body.status).toBe('COMPLETED');
    expect(goalAfterComplete.body.progress.percentComplete).toBe(100);

    active = await request(server).get('/execution/active').set('Authorization', auth()).expect(200);
    expect(active.body).toHaveLength(0);

    const activity = await request(server)
      .get(`/goals/${goalId}/activity`)
      .set('Authorization', auth())
      .expect(200);
    const eventTypes = activity.body.data.map((e: { eventType: string }) => e.eventType);
    expect(eventTypes).toEqual(
      expect.arrayContaining(['TASK_STARTED', 'TASK_COMPLETED', 'GOAL_STATUS_CHANGED']),
    );
  });

  it('rejects starting a task that already has an active session', async () => {
    const server = app.getHttpServer();
    await request(server).post(`/tasks/${taskId}/execution/start`).set('Authorization', auth()).expect(201);
    await request(server).post(`/tasks/${taskId}/execution/start`).set('Authorization', auth()).expect(409);
  });

  it('rejects completing a task with no active session', async () => {
    await request(app.getHttpServer())
      .post(`/tasks/${taskId}/execution/complete`)
      .set('Authorization', auth())
      .expect(404);
  });

  it('rejects unauthenticated access', async () => {
    await request(app.getHttpServer()).get('/execution/active').expect(401);
  });
});
