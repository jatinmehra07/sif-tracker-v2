import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is missing. Check .env.local and restart the dev server.');
}
export const sql = neon(process.env.DATABASE_URL);