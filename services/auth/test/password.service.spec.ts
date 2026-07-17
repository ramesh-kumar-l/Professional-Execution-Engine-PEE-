import { PasswordService } from '../src/password.service';

describe('PasswordService', () => {
  const service = new PasswordService();

  it('produces a hash that verifies against the original password', async () => {
    const hash = await service.hash('correct-horse-battery-staple');
    await expect(service.verify('correct-horse-battery-staple', hash)).resolves.toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const hash = await service.hash('correct-horse-battery-staple');
    await expect(service.verify('wrong-password', hash)).resolves.toBe(false);
  });

  it('never stores the plaintext password in the hash output', async () => {
    const plain = 'correct-horse-battery-staple';
    const hash = await service.hash(plain);
    expect(hash).not.toContain(plain);
  });

  it('produces different hashes for the same password (random salt)', async () => {
    const [hashA, hashB] = await Promise.all([service.hash('same-password'), service.hash('same-password')]);
    expect(hashA).not.toEqual(hashB);
  });
});
