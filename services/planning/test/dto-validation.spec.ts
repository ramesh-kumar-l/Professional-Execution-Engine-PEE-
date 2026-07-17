import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateGoalDto } from '../src/goals/dto/create-goal.dto';
import { ListGoalsQueryDto } from '../src/goals/dto/list-goals-query.dto';
import { UpdateGoalDto } from '../src/goals/dto/update-goal.dto';
import { CreateTaskDto } from '../src/tasks/dto/create-task.dto';
import { ListTasksQueryDto } from '../src/tasks/dto/list-tasks-query.dto';
import { UpdateTaskDto } from '../src/tasks/dto/update-task.dto';

describe('CreateGoalDto validation', () => {
  it('accepts a well-formed payload', async () => {
    const dto = plainToInstance(CreateGoalDto, { title: 'Ship v2', description: 'Relaunch', targetDate: '2026-12-01' });
    expect(await validate(dto)).toHaveLength(0);
  });

  it('rejects a blank title', async () => {
    const dto = plainToInstance(CreateGoalDto, { title: '' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'title')).toBe(true);
  });

  it('rejects an invalid targetDate', async () => {
    const dto = plainToInstance(CreateGoalDto, { title: 'Ship v2', targetDate: 'not-a-date' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'targetDate')).toBe(true);
  });
});

describe('UpdateGoalDto validation', () => {
  it('accepts an empty payload (all fields optional)', async () => {
    const dto = plainToInstance(UpdateGoalDto, {});
    expect(await validate(dto)).toHaveLength(0);
  });

  it('rejects an invalid status', async () => {
    const dto = plainToInstance(UpdateGoalDto, { status: 'DONE' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'status')).toBe(true);
  });
});

describe('ListGoalsQueryDto validation', () => {
  it('rejects a pageSize over 100', async () => {
    const dto = plainToInstance(ListGoalsQueryDto, { pageSize: 500 });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'pageSize')).toBe(true);
  });
});

describe('CreateTaskDto validation', () => {
  it('accepts a well-formed payload', async () => {
    const dto = plainToInstance(CreateTaskDto, { title: 'Write migration', order: 1 });
    expect(await validate(dto)).toHaveLength(0);
  });

  it('rejects a blank title', async () => {
    const dto = plainToInstance(CreateTaskDto, { title: '' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'title')).toBe(true);
  });

  it('rejects a negative order', async () => {
    const dto = plainToInstance(CreateTaskDto, { title: 'Task', order: -1 });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'order')).toBe(true);
  });
});

describe('UpdateTaskDto validation', () => {
  it('rejects an invalid status', async () => {
    const dto = plainToInstance(UpdateTaskDto, { status: 'BLOCKED' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'status')).toBe(true);
  });
});

describe('ListTasksQueryDto validation', () => {
  it('rejects an invalid status filter', async () => {
    const dto = plainToInstance(ListTasksQueryDto, { status: 'BLOCKED' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'status')).toBe(true);
  });
});
