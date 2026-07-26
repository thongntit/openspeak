export function shouldRunMigrationsOnStart(
  nodeEnv: string | undefined,
): boolean {
  return nodeEnv !== 'production';
}
