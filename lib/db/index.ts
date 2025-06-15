import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { ChatSDKError } from '../errors';

// Check if code is running on the server
const isServer = typeof window === 'undefined';

// Create database connection only on the server
let client: ReturnType<typeof postgres> | null = null;
let db: PostgresJsDatabase | null = null;

// Only initialize the database connection on the server
if (isServer) {
  // Ensure POSTGRES_URL is available
  if (!process.env.POSTGRES_URL) {
    console.error('POSTGRES_URL environment variable is not set');
  } else {
    client = postgres(process.env.POSTGRES_URL);
    db = drizzle(client);
  }
}

// Create a safe database instance that throws an error if used on the client
const safeDb = new Proxy({} as PostgresJsDatabase, {
  get: (target, prop) => {
    if (!isServer) {
      throw new Error('Database can only be accessed on the server');
    }
    if (!db) {
      throw new ChatSDKError('bad_request:database', 'Database connection not initialized');
    }
    return db[prop as keyof PostgresJsDatabase];
  },
});

// Export the safe database instance
export { safeDb as db };

// Export everything from the database modules
export * from './chat';
// migrate.ts has no named exports
export * from './project';
export * from './queries';
export * from './schema';
export * from './utils';
