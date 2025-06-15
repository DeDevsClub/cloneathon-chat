-- Drop all tables in the correct order to handle foreign key constraints
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
