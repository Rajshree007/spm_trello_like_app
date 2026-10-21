import fs from 'fs';
import path from 'path';

export default async function globalTeardown() {
  const dbPath = path.resolve(__dirname, '../test.db');
  if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);

  const walPath = dbPath + '-wal';
  if (fs.existsSync(walPath)) fs.unlinkSync(walPath);

  const shmPath = dbPath + '-shm';
  if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);
}
