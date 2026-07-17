import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { LoginDto } from '../src/dto/login.dto';
import { RegisterDto } from '../src/dto/register.dto';

describe('RegisterDto validation', () => {
  it('accepts a well-formed payload', async () => {
    const dto = plainToInstance(RegisterDto, { email: 'a@b.com', password: 'longenough', displayName: 'Ada' });
    expect(await validate(dto)).toHaveLength(0);
  });

  it('rejects an invalid email', async () => {
    const dto = plainToInstance(RegisterDto, { email: 'not-an-email', password: 'longenough', displayName: 'Ada' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'email')).toBe(true);
  });

  it('rejects a password shorter than 8 characters', async () => {
    const dto = plainToInstance(RegisterDto, { email: 'a@b.com', password: 'short', displayName: 'Ada' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'password')).toBe(true);
  });

  it('rejects a blank display name', async () => {
    const dto = plainToInstance(RegisterDto, { email: 'a@b.com', password: 'longenough', displayName: '' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'displayName')).toBe(true);
  });
});

describe('LoginDto validation', () => {
  it('rejects a missing password', async () => {
    const dto = plainToInstance(LoginDto, { email: 'a@b.com', password: '' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'password')).toBe(true);
  });
});
