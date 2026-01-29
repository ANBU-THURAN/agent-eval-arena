import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  driver: 'turso',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'file:./data/arena.db',
    authToken: process.env.DATABASE_AUTH_TOKEN,
  },
} satisfies Config;
