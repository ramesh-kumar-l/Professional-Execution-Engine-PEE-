import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { AuthModule } from '@pee/auth';
import { PrismaModule, PrismaService } from '@pee/database';
import request from 'supertest';
import { OrganizationsModule } from '../src/organizations.module';

/**
 * Requires a real Postgres reachable via DATABASE_URL (see
 * infrastructure/docker/docker-compose.dev.yml) with migrations applied.
 * Run via `npm run test:e2e` in this workspace, not the default `test` script.
 */
describe('Organizations flow (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let ownerToken: string;

  const owner = { email: 'org-owner@test.com', password: 'super-secret-1', displayName: 'Org Owner' };
  const member = { email: 'org-member@test.com', password: 'super-secret-2', displayName: 'Org Member' };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, AuthModule, OrganizationsModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.membership.deleteMany();
    await prisma.organization.deleteMany();
    await prisma.authAuditLog.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();

    const server = app.getHttpServer();
    await request(server).post('/auth/register').send(owner).expect(201);
    await request(server).post('/auth/register').send(member).expect(201);
    const loginRes = await request(server)
      .post('/auth/login')
      .send({ email: owner.email, password: owner.password })
      .expect(200);
    ownerToken = loginRes.body.tokens.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  const auth = (token: string) => `Bearer ${token}`;

  it('gives every new user exactly one personal organization at registration', async () => {
    const meRes = await request(app.getHttpServer()).get('/auth/me').set('Authorization', auth(ownerToken)).expect(200);
    expect(meRes.body.organizations).toHaveLength(1);
    expect(meRes.body.organizations[0]).toEqual(
      expect.objectContaining({ isPersonal: true, role: 'OWNER' }),
    );
  });

  it('walks create -> list -> invite -> promote -> remove for a real organization', async () => {
    const server = app.getHttpServer();

    const created = await request(server)
      .post('/organizations')
      .set('Authorization', auth(ownerToken))
      .send({ name: 'Acme Inc' })
      .expect(201);
    const organizationId = created.body.id;
    expect(created.body.role).toBe('OWNER');

    const invited = await request(server)
      .post(`/organizations/${organizationId}/members`)
      .set('Authorization', auth(ownerToken))
      .send({ email: member.email })
      .expect(201);
    expect(invited.body.role).toBe('MEMBER');

    const memberLogin = await request(server)
      .post('/auth/login')
      .send({ email: member.email, password: member.password })
      .expect(200);
    const memberToken = `Bearer ${memberLogin.body.tokens.accessToken}`;

    // The invited member can see the org and its member list (MEMBER role suffices).
    await request(server).get(`/organizations/${organizationId}`).set('Authorization', memberToken).expect(200);
    const membersList = await request(server)
      .get(`/organizations/${organizationId}/members`)
      .set('Authorization', memberToken)
      .expect(200);
    expect(membersList.body).toHaveLength(2);

    // A plain MEMBER cannot manage membership.
    await request(server)
      .patch(`/organizations/${organizationId}/members/${created.body.id}`)
      .set('Authorization', memberToken)
      .send({ role: 'ADMIN' })
      .expect(403);

    // The OWNER promotes the member to ADMIN, then removes them.
    await request(server)
      .patch(`/organizations/${organizationId}/members/${invited.body.userId}`)
      .set('Authorization', auth(ownerToken))
      .send({ role: 'ADMIN' })
      .expect(200)
      .expect((res) => expect(res.body.role).toBe('ADMIN'));

    await request(server)
      .delete(`/organizations/${organizationId}/members/${invited.body.userId}`)
      .set('Authorization', auth(ownerToken))
      .expect(204);

    const membersAfterRemoval = await request(server)
      .get(`/organizations/${organizationId}/members`)
      .set('Authorization', auth(ownerToken))
      .expect(200);
    expect(membersAfterRemoval.body).toHaveLength(1);
  });

  it('rejects removing the organization last OWNER', async () => {
    const server = app.getHttpServer();
    const created = await request(server)
      .post('/organizations')
      .set('Authorization', auth(ownerToken))
      .send({ name: 'Solo Org' })
      .expect(201);
    const meRes = await request(server).get('/auth/me').set('Authorization', auth(ownerToken)).expect(200);
    const ownerUserId = meRes.body.id;

    await request(server)
      .delete(`/organizations/${created.body.id}/members/${ownerUserId}`)
      .set('Authorization', auth(ownerToken))
      .expect(409);
  });

  it('returns 404 (not 403) for an organization the caller does not belong to', async () => {
    const server = app.getHttpServer();
    const created = await request(server)
      .post('/organizations')
      .set('Authorization', auth(ownerToken))
      .send({ name: 'Private Org' })
      .expect(201);

    const memberLogin = await request(server)
      .post('/auth/login')
      .send({ email: member.email, password: member.password })
      .expect(200);
    const memberToken = `Bearer ${memberLogin.body.tokens.accessToken}`;

    await request(server).get(`/organizations/${created.body.id}`).set('Authorization', memberToken).expect(404);
  });
});
