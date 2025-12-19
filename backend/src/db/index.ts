import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { schema } from './schema/index.js';
import { dirname } from 'path';
import { mkdirSync, existsSync } from 'fs';

const databasePath = process.env.DATABASE_PATH || './data/arena.db';

// Ensure database directory exists
const dbDir = dirname(databasePath);
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
  console.log(`Created database directory: ${dbDir}`);
}

const sqlite = createClient({
  url: `file:${databasePath}`
});

export const db = drizzle(sqlite, { schema });

export { schema };
