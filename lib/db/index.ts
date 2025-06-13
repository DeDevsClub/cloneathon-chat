import 'server-only';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Create database connection
// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
export const db = drizzle(client);

// Export everything from the database modules
export * from './chat';
export * from './migrate';
export * from './project';
export * from './queries';
export * from './schema';
export * from './utils';
