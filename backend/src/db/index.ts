import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { schema } from './schema/index.js';
import { dirname } from 'path';
import { mkdirSync, existsSync } from 'fs';

const databasePath = process.env.DATABASE_PATH || 'libsql://agent-eval-anbu-thuran.aws-ap-south-1.turso.io';

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
