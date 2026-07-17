import { Test } from '@nestjs/testing';
import { HealthController } from '../src/health.controller';

describe('HealthController', () => {
  it('reports ok status without requiring a database connection', async () => {
    const moduleRef = await Test.createTestingModule({ controllers: [HealthController] }).compile();
    const controller = moduleRef.get(HealthController);
    expect(controller.check()).toEqual({ status: 'ok' });
  });
});
