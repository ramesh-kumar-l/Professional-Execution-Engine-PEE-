import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { TimeTrackingQueryDto } from '../src/dto/time-tracking-query.dto';
import { VelocityQueryDto } from '../src/dto/velocity-query.dto';

describe('VelocityQueryDto', () => {
  it('defaults days to 30 when omitted', () => {
    const dto = plainToInstance(VelocityQueryDto, {});
    expect(dto.days).toBe(30);
  });

  it('accepts a valid days value within range', async () => {
    const dto = plainToInstance(VelocityQueryDto, { days: '45' });
    expect(await validate(dto)).toHaveLength(0);
    expect(dto.days).toBe(45);
  });

  it.each(['0', '91', 'not-a-number'])('rejects an out-of-range or non-numeric days value: %s', async (days) => {
    const dto = plainToInstance(VelocityQueryDto, { days });
    expect(await validate(dto)).not.toHaveLength(0);
  });
});

describe('TimeTrackingQueryDto', () => {
  it('defaults groupBy to goal and sinceDays to 90 when omitted', () => {
    const dto = plainToInstance(TimeTrackingQueryDto, {});
    expect(dto.groupBy).toBe('goal');
    expect(dto.sinceDays).toBe(90);
  });

  it('accepts groupBy=project', async () => {
    const dto = plainToInstance(TimeTrackingQueryDto, { groupBy: 'project' });
    expect(await validate(dto)).toHaveLength(0);
  });

  it('rejects an unrecognized groupBy value', async () => {
    const dto = plainToInstance(TimeTrackingQueryDto, { groupBy: 'user' });
    expect(await validate(dto)).not.toHaveLength(0);
  });

  it.each(['0', '366'])('rejects an out-of-range sinceDays value: %s', async (sinceDays) => {
    const dto = plainToInstance(TimeTrackingQueryDto, { sinceDays });
    expect(await validate(dto)).not.toHaveLength(0);
  });
});
