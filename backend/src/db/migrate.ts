import { migrate } from 'drizzle-orm/libsql/migrator';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import path from 'path';
import fs from 'fs';

const databasePath = process.env.DATABASE_PATH || './data/arena.db';

// Ensure data directory exists
const dataDir = path.dirname(databasePath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const sqlite = createClient({
  url: `file:${databasePath}`
});
const db = drizzle(sqlite);

console.log('Running migrations...');
await migrate(db, { migrationsFolder: './drizzle' });
console.log('Migrations complete!');
