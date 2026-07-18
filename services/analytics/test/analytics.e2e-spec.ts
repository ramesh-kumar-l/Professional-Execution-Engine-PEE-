import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Test } from '@nestjs/testing';
import { AuthModule } from '@pee/auth';
import { PrismaModule, PrismaService } from '@pee/database';
import { ExecutionModule } from '@pee/execution';
import { PlanningModule } from '@pee/planning';
import { ProjectsModule } from '@pee/projects';
import request from 'supertest';
import { AnalyticsModule } from '../src/analytics.module';

/**
 * Requires a real Postgres reachable via DATABASE_URL (see
 * infrastructure/docker/docker-compose.dev.yml) with migrations applied.
 * Run via `npm run test:e2e` in this workspace, not the default `test` script.
 */
describe('Analytics (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokenA: string;
  let tokenB: string;
  let goalIdA: string;

  const userA = { email: 'analytics-a@test.com', password: 'super-secret-1', displayName: 'Owner A' };
  const userB = { email: 'analytics-b@test.com', password: 'super-secret-1', displayName: 'Owner B' };

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
        AnalyticsModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.aIRecommendation.deleteMany();
    await prisma.executionEvent.deleteMany();
    await prisma.taskExecutionSession.deleteMany();
    await prisma.task.deleteMany();
    await prisma.goal.deleteMany();
    await prisma.project.deleteMany();
    await prisma.authAuditLog.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();

    const server = app.getHttpServer();

    tokenA = await registerAndSeedCompletedTask(server, userA, (goalId) => (goalIdA = goalId));
    tokenB = await registerAndSeedCompletedTask(server, userB);
  });

  afterAll(async () => {
    await app.close();
  });

  async function registerAndSeedCompletedTask(
    server: Parameters<typeof request>[0],
    credentials: { email: string; password: string; displayName: string },
    captureGoalId?: (goalId: string) => void,
  ): Promise<string> {
    await request(server).post('/auth/register').send(credentials).expect(201);
    const loginRes = await request(server)
      .post('/auth/login')
      .send({ email: credentials.email, password: credentials.password })
      .expect(200);
    const token: string = loginRes.body.tokens.accessToken;
    const auth = `Bearer ${token}`;

    const project = await request(server).post('/projects').set('Authorization', auth).send({ name: 'Project' }).expect(201);
    const goal = await request(server)
      .post(`/projects/${project.body.id}/goals`)
      .set('Authorization', auth)
      .send({ title: 'Goal' })
      .expect(201);
    const task = await request(server)
      .post(`/goals/${goal.body.id}/tasks`)
      .set('Authorization', auth)
      .send({ title: 'Task' })
      .expect(201);

    await request(server).post(`/tasks/${task.body.id}/execution/start`).set('Authorization', auth).expect(201);
    await request(server).post(`/tasks/${task.body.id}/execution/complete`).set('Authorization', auth).expect(200);

    captureGoalId?.(goal.body.id);
    return token;
  }

  const authHeader = (token: string) => `Bearer ${token}`;

  it('summarizes only the authenticated owner\'s data', async () => {
    const res = await request(app.getHttpServer())
      .get('/analytics/summary')
      .set('Authorization', authHeader(tokenA))
      .expect(200);

    expect(res.body.projectsByStatus).toEqual({ ACTIVE: 1 });
    expect(res.body.goalsByStatus).toEqual({ COMPLETED: 1 });
    expect(res.body.tasksByStatus).toEqual({ DONE: 1 });
    expect(res.body.totalTimeTrackedSeconds).toBeGreaterThanOrEqual(0);
    expect(res.body.aiRecommendations).toEqual({ byStatus: {}, acceptanceRate: null });
  });

  it('reports today\'s completion in the velocity window', async () => {
    const res = await request(app.getHttpServer())
      .get('/analytics/velocity?days=1')
      .set('Authorization', authHeader(tokenA))
      .expect(200);

    expect(res.body.days).toBe(1);
    expect(res.body.points).toHaveLength(1);
    expect(res.body.points[0].tasksCompleted).toBe(1);
    expect(res.body.points[0].goalsCompleted).toBe(1);
  });

  it('reports tracked time grouped by goal', async () => {
    const res = await request(app.getHttpServer())
      .get('/analytics/time-tracking?groupBy=goal')
      .set('Authorization', authHeader(tokenA))
      .expect(200);

    expect(res.body.groupBy).toBe('goal');
    expect(res.body.entries).toEqual([{ id: goalIdA, title: 'Goal', totalSeconds: expect.any(Number) }]);
  });

  it('never mixes one owner\'s data into another owner\'s results', async () => {
    const res = await request(app.getHttpServer())
      .get('/analytics/summary')
      .set('Authorization', authHeader(tokenB))
      .expect(200);

    expect(res.body.projectsByStatus).toEqual({ ACTIVE: 1 });
    expect(res.body.tasksByStatus).toEqual({ DONE: 1 });
  });

  it('rejects unauthenticated access', async () => {
    await request(app.getHttpServer()).get('/analytics/summary').expect(401);
  });
});
