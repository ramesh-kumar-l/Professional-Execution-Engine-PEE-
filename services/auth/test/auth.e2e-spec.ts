import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { PrismaModule, PrismaService } from '@pee/database';
import request from 'supertest';
import { AuthModule } from '../src/auth.module';

/**
 * Requires a real Postgres reachable via DATABASE_URL (see
 * infrastructure/docker/docker-compose.dev.yml) with migrations applied.
 * Run via `npm run test:e2e` in this workspace, not the default `test` script.
 */
describe('Auth flow (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const credentials = { email: 'flow@test.com', password: 'super-secret-1', displayName: 'Flow Tester' };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, AuthModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.authAuditLog.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  it('walks register -> login -> me -> refresh -> logout -> old refresh token rejected', async () => {
    const server = app.getHttpServer();

    await request(server).post('/auth/register').send(credentials).expect(201);

    const loginRes = await request(server)
      .post('/auth/login')
      .send({ email: credentials.email, password: credentials.password })
      .expect(200);

    const { accessToken, refreshToken } = loginRes.body.tokens;

    await request(server)
      .get('/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((res) => expect(res.body.email).toBe(credentials.email));

    const refreshRes = await request(server).post('/auth/refresh').send({ refreshToken }).expect(200);
    const rotated = refreshRes.body.refreshToken;
    expect(rotated).not.toEqual(refreshToken);

    // The old refresh token was rotated out — replaying it must revoke the whole session.
    await request(server).post('/auth/refresh').send({ refreshToken }).expect(401);

    // Reuse detection revokes the entire chain, so even the freshly rotated token is now dead.
    await request(server).post('/auth/refresh').send({ refreshToken: rotated }).expect(401);
  });

  it('rejects duplicate registration', async () => {
    const server = app.getHttpServer();
    await request(server).post('/auth/register').send(credentials).expect(201);
    await request(server).post('/auth/register').send(credentials).expect(409);
  });

  it('rejects an incorrect password', async () => {
    const server = app.getHttpServer();
    await request(server).post('/auth/register').send(credentials).expect(201);
    await request(server)
      .post('/auth/login')
      .send({ email: credentials.email, password: 'wrong-password' })
      .expect(401);
  });

  it('logout revokes the refresh token', async () => {
    const server = app.getHttpServer();
    await request(server).post('/auth/register').send(credentials).expect(201);
    const loginRes = await request(server)
      .post('/auth/login')
      .send({ email: credentials.email, password: credentials.password })
      .expect(200);
    const { refreshToken } = loginRes.body.tokens;

    await request(server).post('/auth/logout').send({ refreshToken }).expect(204);
    await request(server).post('/auth/refresh').send({ refreshToken }).expect(401);
  });
});
