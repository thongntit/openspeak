import { shouldRunMigrationsOnStart } from './migration-startup';

describe('shouldRunMigrationsOnStart', () => {
  it.each([
    { nodeEnv: 'development', expected: true },
    { nodeEnv: 'test', expected: true },
    { nodeEnv: 'production', expected: false },
  ])('returns $expected for NODE_ENV=$nodeEnv', ({ nodeEnv, expected }) => {
    expect(shouldRunMigrationsOnStart(nodeEnv)).toBe(expected);
  });
});
