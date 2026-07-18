import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { AuthModule } from '@pee/auth';
import { PrismaModule, PrismaService } from '@pee/database';
import { OrganizationsModule } from '@pee/organizations';
import request from 'supertest';
import { ProjectsModule } from '../src/projects.module';

/**
 * Requires a real Postgres reachable via DATABASE_URL (see
 * infrastructure/docker/docker-compose.dev.yml) with migrations applied.
 * Run via `npm run test:e2e` in this workspace, not the default `test` script.
 */
describe('Projects flow (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;

  const credentials = { email: 'projects-flow@test.com', password: 'super-secret-1', displayName: 'Flow Tester' };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, AuthModule, OrganizationsModule, ProjectsModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.project.deleteMany();
    await prisma.membership.deleteMany();
    await prisma.organization.deleteMany();
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
  });

  afterAll(async () => {
    await app.close();
  });

  const auth = () => `Bearer ${accessToken}`;

  it('walks create -> list -> get -> update -> archive -> excluded from default list', async () => {
    const server = app.getHttpServer();

    const created = await request(server)
      .post('/projects')
      .set('Authorization', auth())
      .send({ name: 'Website Relaunch', description: 'Rebuild the marketing site' })
      .expect(201);
    const projectId = created.body.id;

    const list = await request(server).get('/projects').set('Authorization', auth()).expect(200);
    expect(list.body.data).toHaveLength(1);
    expect(list.body.total).toBe(1);

    await request(server)
      .get(`/projects/${projectId}`)
      .set('Authorization', auth())
      .expect(200)
      .expect((res) => expect(res.body.name).toBe('Website Relaunch'));

    await request(server)
      .patch(`/projects/${projectId}`)
      .set('Authorization', auth())
      .send({ name: 'Website Relaunch v2' })
      .expect(200)
      .expect((res) => expect(res.body.name).toBe('Website Relaunch v2'));

    await request(server).delete(`/projects/${projectId}`).set('Authorization', auth()).expect(204);

    const listAfterArchive = await request(server).get('/projects').set('Authorization', auth()).expect(200);
    expect(listAfterArchive.body.data).toHaveLength(0);

    const archivedList = await request(server)
      .get('/projects?status=ARCHIVED')
      .set('Authorization', auth())
      .expect(200);
    expect(archivedList.body.data).toHaveLength(1);
  });

  it('rejects unauthenticated access', async () => {
    await request(app.getHttpServer()).get('/projects').expect(401);
  });

  it('returns 404 for a project owned by another user', async () => {
    const server = app.getHttpServer();
    const created = await request(server)
      .post('/projects')
      .set('Authorization', auth())
      .send({ name: 'My Project' })
      .expect(201);

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
      .get(`/projects/${created.body.id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(404);
  });

  it('lets any org member read/update a teammate-created project, but only the creator or an org ADMIN can archive it (Phase 10)', async () => {
    const server = app.getHttpServer();

    // Register a second user and invite them into the caller's personal org as a MEMBER.
    await request(server)
      .post('/auth/register')
      .send({ email: 'teammate@test.com', password: 'super-secret-2', displayName: 'Teammate' })
      .expect(201);
    const meRes = await request(server).get('/auth/me').set('Authorization', auth()).expect(200);
    const organizationId = meRes.body.organizations[0].id;
    await request(server)
      .post(`/organizations/${organizationId}/members`)
      .set('Authorization', auth())
      .send({ email: 'teammate@test.com', role: 'MEMBER' })
      .expect(201);
    const teammateLogin = await request(server)
      .post('/auth/login')
      .send({ email: 'teammate@test.com', password: 'super-secret-2' })
      .expect(200);
    const teammateToken = `Bearer ${teammateLogin.body.tokens.accessToken}`;

    // Caller (the org OWNER/creator) creates a project in the shared org.
    const created = await request(server)
      .post('/projects')
      .set('Authorization', auth())
      .send({ name: 'Shared Project', organizationId })
      .expect(201);
    const projectId = created.body.id;

    // The teammate (a plain MEMBER, not the creator) can read and update it.
    await request(server).get(`/projects/${projectId}`).set('Authorization', teammateToken).expect(200);
    await request(server)
      .patch(`/projects/${projectId}`)
      .set('Authorization', teammateToken)
      .send({ name: 'Shared Project (edited by teammate)' })
      .expect(200);

    // But the teammate cannot archive it — only the creator or an org ADMIN/OWNER can.
    await request(server).delete(`/projects/${projectId}`).set('Authorization', teammateToken).expect(403);

    // The creator can.
    await request(server).delete(`/projects/${projectId}`).set('Authorization', auth()).expect(204);
  });
});
