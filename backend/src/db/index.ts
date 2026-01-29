import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { schema } from './schema';
import { dirname } from 'path';
import { mkdirSync, existsSync } from 'fs';

const databaseUrl = process.env.DATABASE_URL || 'file:./data/arena.db';
const authToken = process.env.DATABASE_AUTH_TOKEN;

// Only create directory for local file databases
if (databaseUrl.startsWith('file:')) {
  const dbPath = databaseUrl.replace('file:', '');
  const dbDir = dirname(dbPath);
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true });
    console.log(`Created database directory: ${dbDir}`);
  }
}


const sqlite = createClient({
  url: databaseUrl,
  authToken: authToken
});

export const db = drizzle(sqlite, { schema });

export { schema };
