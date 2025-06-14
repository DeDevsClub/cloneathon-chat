// biome-ignore lint/style/useNodejsImportProtocol: <explanation>
// biome-ignore lint/style/useNodejsImportProtocol: <explanation>
import * as fs from 'fs';
// biome-ignore lint/style/useNodejsImportProtocol: <explanation>
import * as path from 'path';
import postgres from 'postgres';
import 'dotenv/config';

async function resetDatabase() {
  if (!process.env.POSTGRES_URL) {
    console.error('POSTGRES_URL environment variable is not set');
    process.exit(1);
  }

  const client = postgres(process.env.POSTGRES_URL);

  try {
    console.log('Dropping all tables...');

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
    `);

    // Drop the drizzle migrations table
    await client.unsafe(`
      DROP SCHEMA IF EXISTS "drizzle" CASCADE;
    `);

    console.log('All tables dropped successfully');

    // Remove migration meta files
    const metaDir = path.join(process.cwd(), 'lib', 'db', 'migrations', 'meta');
    if (fs.existsSync(metaDir)) {
      try {
        fs.rmSync(metaDir, { recursive: true, force: true });
        console.log('Removed migrations meta directory');
      } catch (err) {
        console.error('Error removing meta directory:', err);
      }
    }

    console.log('Database reset complete. Ready for fresh migrations.');
  } catch (error) {
    console.error('Error dropping tables:', error);
  } finally {
    await client.end();
  }
}

resetDatabase();
