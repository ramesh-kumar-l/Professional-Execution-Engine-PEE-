/**
 * The SQLite half needs zero infra; the Postgres half spins up a real @pee/sync NestJS app and
 * requires DATABASE_URL (see infrastructure/docker) — same carried-forward limitation as every
 * other e2e spec in this repo.
 */
module.exports = {
  rootDir: '.',
  testEnvironment: 'node',
  transform: { '^.+\\.ts$': 'ts-jest' },
  testRegex: '.*\\.e2e-spec\\.ts$',
  moduleFileExtensions: ['ts', 'js', 'json'],
};
