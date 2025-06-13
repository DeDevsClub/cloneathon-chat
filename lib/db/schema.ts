import type { InferSelectModel } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  timestamp,
  jsonb,
  uuid,
  text,
  primaryKey,
  boolean,
  index,
} from 'drizzle-orm/pg-core';

/**
 * User Table - Stores user authentication information
 */
export const user = pgTable(
  'User',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    email: varchar('email', { length: 64 }).notNull().unique(),
    password: varchar('password', { length: 64 }),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    updatedAt: timestamp('updatedAt').defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: index('user_email_idx').on(table.email),
  }),
);

export type User = InferSelectModel<typeof user>;

/**
 * Project Table - Organizes chats into logical groupings
 */
export const project = pgTable(
  'Project',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    updatedAt: timestamp('updatedAt').defaultNow().notNull(),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    icon: varchar('icon', { length: 64 }),
    color: varchar('color', { length: 32 }),
  },
  (table) => ({
    userIdIdx: index('project_userId_idx').on(table.userId),
    createdAtIdx: index('project_createdAt_idx').on(table.createdAt),
  }),
);

export type Project = InferSelectModel<typeof project>;

/**
 * Chat Table - Represents conversation threads
 */
export const chat = pgTable(
  'Chat',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    updatedAt: timestamp('updatedAt').defaultNow().notNull(),
    title: text('title').notNull(),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    visibility: varchar('visibility', { enum: ['public', 'private'] })
      .notNull()
      .default('private'),
    projectId: uuid('projectId').references(() => project.id, {
      onDelete: 'set null',
    }),
    lastActivityAt: timestamp('lastActivityAt').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('chat_userId_idx').on(table.userId),
    projectIdIdx: index('chat_projectId_idx').on(table.projectId),
    lastActivityIdx: index('chat_lastActivity_idx').on(table.lastActivityAt),
  }),
);

export type Chat = InferSelectModel<typeof chat>;

/**
 * Message Table - Individual messages within chats
 */
export const message = pgTable(
  'Message',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    chatId: uuid('chatId')
      .notNull()
      .references(() => chat.id, { onDelete: 'cascade' }),
    role: varchar('role', { length: 20 }).notNull(),
    parts: jsonb('parts').notNull(),
    attachments: jsonb('attachments').notNull(),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    // Extracted fields for faster queries without JSON parsing
    contentType: varchar('contentType', { length: 50 }),
    textContent: text('textContent'),
  },
  (table) => ({
    chatIdIdx: index('message_chatId_idx').on(table.chatId),
    createdAtIdx: index('message_createdAt_idx').on(table.createdAt),
    roleIdx: index('message_role_idx').on(table.role),
  }),
);

export type Message = InferSelectModel<typeof message>;

/**
 * Vote Table - User votes/ratings on messages
 */
export const vote = pgTable(
  'Vote',
  {
    // Using composite primary key of all three IDs
    chatId: uuid('chatId')
      .notNull()
      .references(() => chat.id, { onDelete: 'cascade' }),
    messageId: uuid('messageId')
      .notNull()
      .references(() => message.id, { onDelete: 'cascade' }),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    isUpvoted: boolean('isUpvoted').notNull(),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.chatId, table.messageId, table.userId] }),
    messageIdIdx: index('vote_messageId_idx').on(table.messageId),
    userIdIdx: index('vote_userId_idx').on(table.userId),
  }),
);

export type Vote = InferSelectModel<typeof vote>;

/**
 * Document Table - Stores artifacts/documents created during chats
 */
export const document = pgTable(
  'Document',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    updatedAt: timestamp('updatedAt').defaultNow().notNull(),
    title: text('title').notNull(),
    content: text('content'),
    kind: varchar('kind', { enum: ['text', 'code', 'image', 'sheet'] })
      .notNull()
      .default('text'),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    chatId: uuid('chatId').references(() => chat.id, { onDelete: 'set null' }),
    messageId: uuid('messageId').references(() => message.id, {
      onDelete: 'set null',
    }),
  },
  (table) => ({
    userIdIdx: index('document_userId_idx').on(table.userId),
    chatIdIdx: index('document_chatId_idx').on(table.chatId),
    createdAtIdx: index('document_createdAt_idx').on(table.createdAt),
    kindIdx: index('document_kind_idx').on(table.kind),
  }),
);

export type Document = InferSelectModel<typeof document>;

/**
 * Suggestion Table - Stores suggestions/edits for documents
 */
export const suggestion = pgTable(
  'Suggestion',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    documentId: uuid('documentId')
      .notNull()
      .references(() => document.id, { onDelete: 'cascade' }),
    originalText: text('originalText').notNull(),
    suggestedText: text('suggestedText').notNull(),
    description: text('description'),
    isResolved: boolean('isResolved').notNull().default(false),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    updatedAt: timestamp('updatedAt').defaultNow().notNull(),
  },
  (table) => ({
    documentIdIdx: index('suggestion_documentId_idx').on(table.documentId),
    userIdIdx: index('suggestion_userId_idx').on(table.userId),
    isResolvedIdx: index('suggestion_isResolved_idx').on(table.isResolved),
  }),
);

export type Suggestion = InferSelectModel<typeof suggestion>;

/**
 * Stream Table - Manages streaming connections for real-time updates
 */
export const stream = pgTable(
  'Stream',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    chatId: uuid('chatId')
      .notNull()
      .references(() => chat.id, { onDelete: 'cascade' }),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    status: varchar('status', { enum: ['active', 'inactive', 'completed'] })
      .notNull()
      .default('active'),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expiresAt'),
  },
  (table) => ({
    chatIdIdx: index('stream_chatId_idx').on(table.chatId),
    userIdIdx: index('stream_userId_idx').on(table.userId),
    statusIdx: index('stream_status_idx').on(table.status),
  }),
);

export type Stream = InferSelectModel<typeof stream>;

// Relations

export const userRelations = relations(user, ({ many }) => ({
  projects: many(project),
  chats: many(chat),
  documents: many(document),
  suggestions: many(suggestion),
  votes: many(vote),
  streams: many(stream),
}));

export const projectRelations = relations(project, ({ one, many }) => ({
  user: one(user, {
    fields: [project.userId],
    references: [user.id],
  }),
  chats: many(chat),
}));

export const chatRelations = relations(chat, ({ one, many }) => ({
  user: one(user, {
    fields: [chat.userId],
    references: [user.id],
  }),
  project: one(project, {
    fields: [chat.projectId],
    references: [project.id],
  }),
  messages: many(message),
  documents: many(document),
  streams: many(stream),
  votes: many(vote),
}));

export const messageRelations = relations(message, ({ one, many }) => ({
  chat: one(chat, {
    fields: [message.chatId],
    references: [chat.id],
  }),
  votes: many(vote),
  documents: many(document),
}));

export const voteRelations = relations(vote, ({ one }) => ({
  message: one(message, {
    fields: [vote.messageId],
    references: [message.id],
  }),
  chat: one(chat, {
    fields: [vote.chatId],
    references: [chat.id],
  }),
  user: one(user, {
    fields: [vote.userId],
    references: [user.id],
  }),
}));

export const documentRelations = relations(document, ({ one, many }) => ({
  user: one(user, {
    fields: [document.userId],
    references: [user.id],
  }),
  chat: one(chat, {
    fields: [document.chatId],
    references: [chat.id],
  }),
  message: one(message, {
    fields: [document.messageId],
    references: [message.id],
  }),
  suggestions: many(suggestion),
}));

export const suggestionRelations = relations(suggestion, ({ one }) => ({
  document: one(document, {
    fields: [suggestion.documentId],
    references: [document.id],
  }),
  user: one(user, {
    fields: [suggestion.userId],
    references: [user.id],
  }),
}));

export const streamRelations = relations(stream, ({ one }) => ({
  chat: one(chat, {
    fields: [stream.chatId],
    references: [chat.id],
  }),
  user: one(user, {
    fields: [stream.userId],
    references: [user.id],
  }),
}));
