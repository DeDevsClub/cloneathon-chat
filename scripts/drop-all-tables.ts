import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import 'dotenv/config';

async function dropAllTables() {
  if (!process.env.POSTGRES_URL) {
    console.error('POSTGRES_URL environment variable is not set');
    process.exit(1);
  }

  const client = postgres(process.env.POSTGRES_URL);
  const db = drizzle(client);

  console.log('Dropping all tables...');

  try {
    // Drop tables in the correct order to handle foreign key constraints
    await client.unsafe(`
      DROP TABLE IF EXISTS "Suggestion" CASCADE;
      DROP TABLE IF EXISTS "Document" CASCADE;
      DROP TABLE IF EXISTS "Vote" CASCADE;
      DROP TABLE IF EXISTS "Message" CASCADE;
      DROP TABLE IF EXISTS "Stream" CASCADE;
      DROP TABLE IF EXISTS "Chat" CASCADE;
      DROP TABLE IF EXISTS "Project" CASCADE;
      DROP TABLE IF EXISTS "User" CASCADE;
      
      -- Drop the drizzle migrations table
      DROP TABLE IF EXISTS "drizzle"."__drizzle_migrations" CASCADE;
      DROP SCHEMA IF EXISTS "drizzle" CASCADE;
    `);

    console.log('All tables dropped successfully');
  } catch (error) {
    console.error('Error dropping tables:', error);
  } finally {
    await client.end();
  }
}

dropAllTables();
