// biome-ignore lint/style/useNodejsImportProtocol: <explanation>
import * as fs from 'fs';
// biome-ignore lint/style/useNodejsImportProtocol: <explanation>
import * as path from 'path';
// import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import 'dotenv/config';

async function resetDatabase() {
  if (!process.env.POSTGRES_URL) {
    console.error('POSTGRES_URL environment variable is not set');
    process.exit(1);
  }

  const client = postgres(process.env.POSTGRES_URL);

  try {
    console.log('Dropping all tables and resetting database...');

    // Get all tables in the database
    const tables = await client`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public'
    `;

    // Disable triggers temporarily
    await client`SET session_replication_role = 'replica'`;

    // Drop all tables
    for (const table of tables) {
      await client`DROP TABLE IF EXISTS "${table.tablename}" CASCADE`;
      console.log(`Dropped table: ${table.tablename}`);
    }

    // Re-enable triggers
    await client`SET session_replication_role = 'origin'`;

    // Drop the drizzle schema and migrations table
    await client`DROP SCHEMA IF EXISTS "drizzle" CASCADE`;
    console.log('Dropped drizzle schema');

    // Reset the migrations folder by removing meta directory
    const metaDir = path.join(process.cwd(), 'lib', 'db', 'migrations', 'meta');
    if (fs.existsSync(metaDir)) {
      fs.rmSync(metaDir, { recursive: true, force: true });
      console.log('Removed migrations meta directory');
    }

    console.log('Database reset complete. Ready for fresh migrations.');
  } catch (error) {
    console.error('Error resetting database:', error);
  } finally {
    await client.end();
  }
}

resetDatabase();
