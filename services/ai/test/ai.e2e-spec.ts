import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Test } from '@nestjs/testing';
import { AuthModule } from '@pee/auth';
import { PrismaModule, PrismaService } from '@pee/database';
import { PlanningModule } from '@pee/planning';
import { ProjectsModule } from '@pee/projects';
import request from 'supertest';
import { AIModule } from '../src/ai.module';
import { AI_PROVIDER_TOKEN } from '../src/provider/ai-provider.interface';

/**
 * Requires a real Postgres reachable via DATABASE_URL (see infrastructure/docker/docker-compose.dev.yml)
 * with migrations applied. Run via `npm run test:e2e` in this workspace, not the default `test` script.
 *
 * Unlike Phase 1-5's flagship e2e specs, this one needs NO vendor API keys — AI_PROVIDER_TOKEN is
 * overridden with an in-test fake provider, so it proves the full HTTP -> persist -> accept ->
 * real-Task-creation round trip purely against Docker Postgres.
 */
describe('AI recommendations (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let goalId: string;
  const fakeComplete = jest.fn();

  const credentials = { email: 'ai-flow@test.com', password: 'super-secret-1', displayName: 'AI Tester' };

  const defaultSuggestions = {
    suggestions: [
      { title: 'Write tests', reason: 'Ensures correctness', confidence: 0.8, alternatives: ['Skip testing'] },
      { title: 'Update docs', reason: 'Improves onboarding', confidence: 0.5, alternatives: ['Leave as-is'] },
    ],
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        EventEmitterModule.forRoot(),
        PrismaModule,
        AuthModule,
        ProjectsModule,
        PlanningModule,
        AIModule,
      ],
    })
      .overrideProvider(AI_PROVIDER_TOKEN)
      .useValue({ complete: fakeComplete })
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
    await app.init();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    fakeComplete.mockReset().mockResolvedValue({
      text: '',
      structured: defaultSuggestions,
      provider: 'anthropic',
      model: 'fake-model',
    });

    await prisma.aIRecommendation.deleteMany();
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

    const project = await request(server).post('/projects').set('Authorization', auth()).send({ name: 'Launch' }).expect(201);
    const goal = await request(server)
      .post(`/projects/${project.body.id}/goals`)
      .set('Authorization', auth())
      .send({ title: 'Ship v2' })
      .expect(201);
    goalId = goal.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  const auth = () => `Bearer ${accessToken}`;

  it('generates suggestions with explainability fields, without creating any Task', async () => {
    const server = app.getHttpServer();

    const res = await request(server)
      .post(`/goals/${goalId}/ai/task-suggestions`)
      .set('Authorization', auth())
      .send({})
      .expect(201);

    expect(res.body.status).toBe('PENDING');
    expect(res.body.suggestions).toHaveLength(2);
    expect(res.body.suggestions[0]).toMatchObject({
      title: 'Write tests',
      reason: 'Ensures correctness',
      confidence: 0.8,
      alternatives: ['Skip testing'],
    });

    const tasks = await request(server).get(`/goals/${goalId}/tasks`).set('Authorization', auth()).expect(200);
    expect(tasks.body.data).toHaveLength(0);
  });

  it('accepts selected suggestions, creating exactly those Tasks and closing the loop', async () => {
    const server = app.getHttpServer();
    const generated = await request(server)
      .post(`/goals/${goalId}/ai/task-suggestions`)
      .set('Authorization', auth())
      .send({})
      .expect(201);

    const acceptRes = await request(server)
      .post(`/ai/recommendations/${generated.body.id}/accept`)
      .set('Authorization', auth())
      .send({ acceptedIndices: [0] })
      .expect(201);

    expect(acceptRes.body.recommendation.status).toBe('ACCEPTED');
    expect(acceptRes.body.createdTasks).toHaveLength(1);
    expect(acceptRes.body.createdTasks[0].title).toBe('Write tests');

    const tasks = await request(server).get(`/goals/${goalId}/tasks`).set('Authorization', auth()).expect(200);
    expect(tasks.body.data).toHaveLength(1);
    expect(tasks.body.data[0].title).toBe('Write tests');

    await request(server)
      .post(`/ai/recommendations/${generated.body.id}/accept`)
      .set('Authorization', auth())
      .send({ acceptedIndices: [1] })
      .expect(409);
  });

  it('dismisses suggestions, creating no Task', async () => {
    const server = app.getHttpServer();
    const generated = await request(server)
      .post(`/goals/${goalId}/ai/task-suggestions`)
      .set('Authorization', auth())
      .send({})
      .expect(201);

    const dismissRes = await request(server)
      .post(`/ai/recommendations/${generated.body.id}/dismiss`)
      .set('Authorization', auth())
      .expect(201);

    expect(dismissRes.body.status).toBe('DISMISSED');
    const tasks = await request(server).get(`/goals/${goalId}/tasks`).set('Authorization', auth()).expect(200);
    expect(tasks.body.data).toHaveLength(0);
  });

  it('fails gracefully and never fabricates a suggestion when the provider errors out', async () => {
    fakeComplete.mockReset().mockRejectedValue(new Error('vendor outage'));
    const server = app.getHttpServer();

    await request(server).post(`/goals/${goalId}/ai/task-suggestions`).set('Authorization', auth()).send({}).expect(503);

    const list = await request(server).get(`/goals/${goalId}/ai/task-suggestions`).set('Authorization', auth()).expect(200);
    expect(list.body.data[0].status).toBe('FAILED');
  });

  it('rejects unauthenticated access', async () => {
    await request(app.getHttpServer()).post(`/goals/${goalId}/ai/task-suggestions`).send({}).expect(401);
  });
});
