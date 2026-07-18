import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

/** Programmatic equivalent of the global ValidationPipe, for the opaque per-entity `data` blob inside a push change. */
export async function validatePayload<T extends object>(
  cls: new () => T,
  data: Record<string, unknown>,
): Promise<T | null> {
  const instance = plainToInstance(cls, data);
  const errors = await validate(instance, { whitelist: true, forbidNonWhitelisted: true });
  return errors.length === 0 ? instance : null;
}
