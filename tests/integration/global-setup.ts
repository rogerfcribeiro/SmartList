import { execSync } from 'node:child_process';

let container: import('@testcontainers/postgresql').StartedPostgreSqlContainer | null = null;

export async function setup() {
  try {
    const { PostgreSqlContainer } = await import('@testcontainers/postgresql');
    container = await new PostgreSqlContainer('postgres:16-alpine').start();

    const url = container.getConnectionUri();
    process.env.DATABASE_URL = url;
    process.env.POSTGRES_AVAILABLE = 'true';

    // Apply schema (no migration files needed in test env)
    execSync('npx prisma db push --skip-generate --accept-data-loss', {
      env: { ...process.env, DATABASE_URL: url },
      stdio: 'pipe',
    });

    console.log('[integration] PostgreSQL container started');
  } catch (error) {
    console.warn('[integration] Docker not available — tests will be skipped:', (error as Error).message);
    process.env.POSTGRES_AVAILABLE = 'false';
  }
}

export async function teardown() {
  if (container) {
    await container.stop();
    console.log('[integration] PostgreSQL container stopped');
  }
}
