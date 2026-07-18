import { ServiceUnavailableException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '@pee/database';
import { HealthController } from '../src/health.controller';

describe('HealthController', () => {
  async function buildController(prisma: Partial<PrismaService>) {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: PrismaService, useValue: prisma }],
    }).compile();
    return moduleRef.get(HealthController);
  }

  it('reports ok status when the database responds', async () => {
    const controller = await buildController({ $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]) } as any);
    await expect(controller.check()).resolves.toEqual({ status: 'ok', database: 'ok' });
  });

  it('fails closed with 503 when the database is unreachable', async () => {
    const controller = await buildController({ $queryRaw: jest.fn().mockRejectedValue(new Error('ECONNREFUSED')) } as any);
    await expect(controller.check()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
