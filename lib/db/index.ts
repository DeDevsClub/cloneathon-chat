// Ensure this code only runs on the server
const isServer = typeof window === 'undefined';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Create database connection
// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
export const db = drizzle(client);

// Export everything from the database modules
export * from './chat';
// migrate.ts has no named exports
export * from './project';
export * from './queries';
export * from './schema';
export * from './utils';
