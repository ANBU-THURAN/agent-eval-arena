import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  driver: 'turso',
  dbCredentials: {
    url: `file:${process.env.DATABASE_PATH || './data/arena.db'}`,
  },
} satisfies Config;
