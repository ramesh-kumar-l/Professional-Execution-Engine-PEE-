import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateProjectDto } from '../src/dto/create-project.dto';
import { ListProjectsQueryDto } from '../src/dto/list-projects-query.dto';
import { UpdateProjectDto } from '../src/dto/update-project.dto';

describe('CreateProjectDto validation', () => {
  it('accepts a well-formed payload', async () => {
    const dto = plainToInstance(CreateProjectDto, { name: 'Website Relaunch', description: 'Rebuild the site' });
    expect(await validate(dto)).toHaveLength(0);
  });

  it('accepts a payload without a description', async () => {
    const dto = plainToInstance(CreateProjectDto, { name: 'Website Relaunch' });
    expect(await validate(dto)).toHaveLength(0);
  });

  it('rejects a blank name', async () => {
    const dto = plainToInstance(CreateProjectDto, { name: '' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'name')).toBe(true);
  });

  it('rejects a name over 150 characters', async () => {
    const dto = plainToInstance(CreateProjectDto, { name: 'x'.repeat(151) });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'name')).toBe(true);
  });
});

describe('UpdateProjectDto validation', () => {
  it('accepts an empty payload (all fields optional)', async () => {
    const dto = plainToInstance(UpdateProjectDto, {});
    expect(await validate(dto)).toHaveLength(0);
  });

  it('rejects an invalid status', async () => {
    const dto = plainToInstance(UpdateProjectDto, { status: 'DELETED' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'status')).toBe(true);
  });
});

describe('ListProjectsQueryDto validation', () => {
  it('rejects a pageSize over 100', async () => {
    const dto = plainToInstance(ListProjectsQueryDto, { pageSize: 500 });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'pageSize')).toBe(true);
  });

  it('rejects an invalid status filter', async () => {
    const dto = plainToInstance(ListProjectsQueryDto, { status: 'DONE' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'status')).toBe(true);
  });
});
