# Database Architecture & UI Integration

This document provides a comprehensive overview of the database architecture used in the application, including detailed diagrams of table structures, relationships between tables, and where/how this data is used within the user interface.

## Table of Contents

- [Database Architecture \& UI Integration](#database-architecture--ui-integration)
  - [Table of Contents](#table-of-contents)
  - [Database Overview](#database-overview)
  - [Database Schema](#database-schema)
    - [User Table](#user-table)
    - [Project Table](#project-table)
    - [Chat Table](#chat-table)
    - [Message Table](#message-table)
    - [Vote Table](#vote-table)
    - [Document Table](#document-table)
    - [Suggestion Table](#suggestion-table)
    - [Stream Table](#stream-table)
  - [Relations \& Foreign Keys](#relations--foreign-keys)
  - [UI Data Integration](#ui-data-integration)
    - [Authentication Flow](#authentication-flow)
    - [Projects Management](#projects-management)
    - [Chat Interface](#chat-interface)
    - [Document \& Suggestion Management](#document--suggestion-management)

## Database Overview

The application uses a PostgreSQL database with Drizzle ORM for type-safe database access. The schema is designed around several core entities:

- **Users**: Stores authentication information
- **Projects**: Organizes chats into logical groupings
- **Chats**: Stores conversation histories
- **Messages**: Contains the actual chat messages with support for rich content
- **Documents & Suggestions**: Supports artifact creation and collaboration

## Database Schema

### User Table

```
┌─────────────────────┐
│ User                │
├─────────────────────┤
│ id: uuid (PK)       │
│ email: varchar(64)  │
│ password: varchar(64)│
└─────────────────────┘
```

**Description**: Stores user authentication information.

**Fields**:

- `id`: UUID primary key, auto-generated
- `email`: User's email address (required, unique)
- `password`: Hashed password

### Project Table

```
┌─────────────────────┐
│ Project             │
├─────────────────────┤
│ id: uuid (PK)       │
│ name: varchar(255)  │
│ description: text    │
│ createdAt: timestamp │
│ updatedAt: timestamp │
│ userId: uuid (FK)    │
│ icon: varchar(64)    │
│ color: varchar(32)   │
└─────────────────────┘
```

**Description**: Organizes chats into logical groupings or projects.

**Fields**:

- `id`: UUID primary key, auto-generated
- `name`: Project name (required)
- `description`: Project description
- `createdAt`: Timestamp of creation
- `updatedAt`: Timestamp of last update
- `userId`: Foreign key to User table (owner)
- `icon`: Emoji or icon representation
- `color`: Color theme for the project

### Chat Table

```
┌─────────────────────┐
│ Chat                │
├─────────────────────┤
│ id: uuid (PK)       │
│ createdAt: timestamp │
│ title: text          │
│ userId: uuid (FK)    │
│ visibility: varchar  │
│ projectId: uuid (FK) │
└─────────────────────┘
```

**Description**: Represents a conversation thread that can contain multiple messages.

**Fields**:

- `id`: UUID primary key, auto-generated
- `createdAt`: Timestamp of creation
- `title`: Chat title/name (required)
- `userId`: Foreign key to User table (owner)
- `visibility`: Enum: 'public' or 'private', defaults to 'private'
- `projectId`: Optional foreign key to Project table

### Message Table

```
┌─────────────────────┐
│ Message_v2          │
├─────────────────────┤
│ id: uuid (PK)       │
│ chatId: uuid (FK)   │
│ role: varchar       │
│ parts: json         │
│ attachments: json   │
│ createdAt: timestamp│
└─────────────────────┘
```

**Description**: Contains individual messages within a chat.

**Fields**:

- `id`: UUID primary key, auto-generated
- `chatId`: Foreign key to Chat table
- `role`: Message sender role (e.g., 'user', 'assistant')
- `parts`: JSON content of the message
- `attachments`: JSON array of attachments
- `createdAt`: Timestamp of creation

### Vote Table

```
┌─────────────────────┐
│ Vote_v2             │
├─────────────────────┤
│ chatId: uuid (PK)   │
│ messageId: uuid (PK)│
│ isUpvoted: boolean  │
└─────────────────────┘
```

**Description**: Stores user votes/ratings on messages.

**Fields**:

- `chatId`: Part of composite primary key, foreign key to Chat table
- `messageId`: Part of composite primary key, foreign key to Message table
- `isUpvoted`: Boolean indicating upvote (true) or downvote (false)

### Document Table

```
┌─────────────────────┐
│ Document            │
├─────────────────────┤
│ id: uuid (PK)       │
│ createdAt: timestamp (PK) │
│ title: text         │
│ content: text       │
│ kind: varchar       │
│ userId: uuid (FK)   │
└─────────────────────┘
```

**Description**: Stores documents/artifacts created during chats.

**Fields**:

- `id`: Part of composite primary key, UUID
- `createdAt`: Part of composite primary key, timestamp of creation
- `title`: Document title (required)
- `content`: Document content
- `kind`: Type of document (enum: 'text', 'code', 'image', 'sheet')
- `userId`: Foreign key to User table (owner)

### Suggestion Table

```
┌─────────────────────┐
│ Suggestion          │
├─────────────────────┤
│ id: uuid (PK)       │
│ documentId: uuid (FK)│
│ documentCreatedAt: timestamp (FK) │
│ originalText: text  │
│ suggestedText: text │
│ description: text   │
│ isResolved: boolean │
│ userId: uuid (FK)   │
│ createdAt: timestamp │
└─────────────────────┘
```

**Description**: Stores suggestions/edits for documents.

**Fields**:

- `id`: UUID primary key, auto-generated
- `documentId`: Part of foreign key to Document table
- `documentCreatedAt`: Part of foreign key to Document table
- `originalText`: Original text being modified
- `suggestedText`: Suggested replacement text
- `description`: Description of the suggestion
- `isResolved`: Whether the suggestion has been accepted/rejected
- `userId`: Foreign key to User table (suggestion creator)
- `createdAt`: Timestamp of creation

### Stream Table

```
┌─────────────────────┐
│ Stream              │
├─────────────────────┤
│ id: uuid (PK)       │
│ chatId: uuid (FK)   │
│ createdAt: timestamp │
└─────────────────────┘
```

**Description**: Manages streaming connections for real-time chat updates.

**Fields**:

- `id`: UUID primary key, auto-generated
- `chatId`: Foreign key to Chat table
- `createdAt`: Timestamp of creation

## Relations & Foreign Keys

```
┌───────┐     ┌─────────┐     ┌──────┐     ┌─────────┐     ┌────────────┐
│ User  │1   *│ Project │1   *│ Chat │1   *│ Message │1   *│ Vote       │
└───┬───┘     └────┬────┘     └──┬───┘     └────┬────┘     └────────────┘
    │              │            │            │
    │              │            │            │
    │1             │            │1           │
    │              │            │            │
    ▼              ▼            ▼            │
┌───────┐     ┌─────────┐   ┌──────┐        │
│Document│     │Suggestion│   │Stream│◄──────┘
└───────┘     └─────────┘   └──────┘
```

**Key Relations**:

1. **User - Project**: One-to-many (a user can have multiple projects)
2. **User - Chat**: One-to-many (a user can have multiple chats)
3. **Project - Chat**: One-to-many (a project can contain multiple chats)
4. **Chat - Message**: One-to-many (a chat can have multiple messages)
5. **Chat - Stream**: One-to-many (a chat can have multiple stream connections)
6. **Message - Vote**: One-to-many (a message can have multiple votes)
7. **User - Document**: One-to-many (a user can create multiple documents)
8. **Document - Suggestion**: One-to-many (a document can have multiple suggestions)

## UI Data Integration

### Authentication Flow

**Login Page** (`app/(auth)/login/page.tsx`)

- **Database Tables**: User
- **Usage**: Validates user credentials against the User table
- **Operations**: Read

**Signup Page** (`app/(auth)/signup/page.tsx`)

- **Database Tables**: User
- **Usage**: Creates new user records
- **Operations**: Create

### Projects Management

**Projects List** (`app/(chat)/projects/page.tsx`)

- **Database Tables**: Project
- **Usage**: Lists all projects for the current user
- **Operations**: Read

**Project Detail** (`app/(chat)/projects/[id]/page.tsx`)

- **Database Tables**: Project, Chat
- **Usage**: Displays project details and associated chats
- **Operations**: Read

**Project Creation** (`app/(chat)/projects/new/page.tsx`)

- **Database Tables**: Project
- **Usage**: Creates new projects
- **Operations**: Create

**Project Edit** (`app/(chat)/projects/[id]/edit/page.tsx`)

- **Database Tables**: Project
- **Usage**: Updates existing project details
- **Operations**: Update

### Chat Interface

**Chat List** (`app/(chat)/page.tsx`)

- **Database Tables**: Chat
- **Usage**: Lists all chats for the current user
- **Operations**: Read

**Chat Detail** (`app/(chat)/chat/[id]/page.tsx`)

- **Database Tables**: Chat, Message, Vote, Stream
- **Usage**: Displays chat conversation and handles message streaming
- **Operations**: Read, Create (for new messages)

**Project Chat List** (`app/(chat)/projects/[id]/page.tsx`)

- **Database Tables**: Project, Chat
- **Usage**: Lists chats associated with a specific project
- **Operations**: Read

**Chat Creation** (`app/(chat)/chat/new/page.tsx`)

- **Database Tables**: Chat, Project
- **Usage**: Creates new chats, optionally associated with a project
- **Operations**: Create

### Document & Suggestion Management

**Artifact Component** (`components/chat/artifact.tsx`)

- **Database Tables**: Document
- **Usage**: Renders and manages artifacts created during chats
- **Operations**: Read, Create

**Artifact Messages** (`components/chat/artifact-messages.tsx`)

- **Database Tables**: Document, Suggestion
- **Usage**: Renders messages with artifact attachments
- **Operations**: Read

**Document Editor** (Various components)

- **Database Tables**: Document, Suggestion
- **Usage**: Provides interfaces for creating and editing documents
- **Operations**: Create, Update
