import 'dotenv/config';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import path from 'path';
import fs from 'fs';

const databaseUrl = process.env.DATABASE_URL || 'file:./data/arena.db';
const authToken = process.env.DATABASE_AUTH_TOKEN;

// Only create directory for local file databases
if (databaseUrl.startsWith('file:')) {
  const dbPath = databaseUrl.replace('file:', '');
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

console.log(`Connecting to database: ${databaseUrl}`);

const sqlite = createClient({
  url: databaseUrl,
  authToken: authToken
});
const db = drizzle(sqlite);

console.log('Running migrations...');
await migrate(db, { migrationsFolder: './drizzle' });
console.log('Migrations complete!');
