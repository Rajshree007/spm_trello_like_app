import { execSync } from 'child_process';
import path from 'path';

export default async function globalSetup() {
  process.env.DATABASE_URL = 'file:./test.db';
  process.env.JWT_SECRET = 'test-secret-key';
  process.env.NODE_ENV = 'test';

  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: 'file:./test.db' },
    cwd: path.resolve(__dirname, '..'),
    stdio: 'inherit',
  });
}
