import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { GoalSyncFieldsDto } from '../src/dto/entity-payloads/goal-sync-fields.dto';
import { ProjectSyncFieldsDto } from '../src/dto/entity-payloads/project-sync-fields.dto';
import { TaskSyncFieldsDto } from '../src/dto/entity-payloads/task-sync-fields.dto';
import { SyncPullQueryDto } from '../src/dto/sync-pull-query.dto';
import { SyncPushRequestDto } from '../src/dto/sync-push-request.dto';

describe('SyncPullQueryDto validation', () => {
  it('accepts an empty payload (since is optional)', async () => {
    const dto = plainToInstance(SyncPullQueryDto, {});
    expect(await validate(dto)).toHaveLength(0);
  });

  it('rejects a non-ISO since value', async () => {
    const dto = plainToInstance(SyncPullQueryDto, { since: 'not-a-date' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'since')).toBe(true);
  });
});

describe('SyncPushRequestDto validation', () => {
  const validChange = {
    entity: 'project',
    id: '11111111-1111-4111-8111-111111111111',
    data: { name: 'Synced' },
    clientUpdatedAt: '2026-01-01T00:00:00.000Z',
    clientVersion: 1,
  };

  it('accepts a well-formed change list', async () => {
    const dto = plainToInstance(SyncPushRequestDto, { changes: [validChange] });
    expect(await validate(dto)).toHaveLength(0);
  });

  it('rejects an unknown entity name', async () => {
    const dto = plainToInstance(SyncPushRequestDto, { changes: [{ ...validChange, entity: 'widget' }] });
    const errors = await validate(dto);
    expect(errors).not.toHaveLength(0);
  });

  it('rejects a non-UUID id', async () => {
    const dto = plainToInstance(SyncPushRequestDto, { changes: [{ ...validChange, id: 'not-a-uuid' }] });
    const errors = await validate(dto);
    expect(errors).not.toHaveLength(0);
  });

  it('rejects a clientVersion below 1', async () => {
    const dto = plainToInstance(SyncPushRequestDto, { changes: [{ ...validChange, clientVersion: 0 }] });
    const errors = await validate(dto);
    expect(errors).not.toHaveLength(0);
  });

  it('rejects more than 500 changes in one push', async () => {
    const changes = Array.from({ length: 501 }, () => validChange);
    const dto = plainToInstance(SyncPushRequestDto, { changes });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'changes')).toBe(true);
  });
});

describe('ProjectSyncFieldsDto validation', () => {
  it('accepts an empty payload (all fields optional)', async () => {
    expect(await validate(plainToInstance(ProjectSyncFieldsDto, {}))).toHaveLength(0);
  });

  it('rejects a non-string name', async () => {
    const errors = await validate(plainToInstance(ProjectSyncFieldsDto, { name: 123 }));
    expect(errors.some((e) => e.property === 'name')).toBe(true);
  });

  it('rejects an invalid status', async () => {
    const errors = await validate(plainToInstance(ProjectSyncFieldsDto, { status: 'DELETED' }));
    expect(errors.some((e) => e.property === 'status')).toBe(true);
  });
});

describe('GoalSyncFieldsDto validation', () => {
  it('accepts a create-shaped payload with projectId + title', async () => {
    const dto = plainToInstance(GoalSyncFieldsDto, { projectId: '11111111-1111-4111-8111-111111111111', title: 'Ship v2' });
    expect(await validate(dto)).toHaveLength(0);
  });

  it('rejects a non-UUID projectId', async () => {
    const errors = await validate(plainToInstance(GoalSyncFieldsDto, { projectId: 'nope' }));
    expect(errors.some((e) => e.property === 'projectId')).toBe(true);
  });
});

describe('TaskSyncFieldsDto validation', () => {
  it('accepts a create-shaped payload with goalId + title', async () => {
    const dto = plainToInstance(TaskSyncFieldsDto, { goalId: '11111111-1111-4111-8111-111111111111', title: 'Write copy' });
    expect(await validate(dto)).toHaveLength(0);
  });

  it('rejects a negative order', async () => {
    const errors = await validate(plainToInstance(TaskSyncFieldsDto, { order: -1 }));
    expect(errors.some((e) => e.property === 'order')).toBe(true);
  });
});
