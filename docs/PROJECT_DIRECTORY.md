# Project-Level Chat Directory Feature

This document provides an overview of the project-level directory feature implementation in the cloneathon-chat application.

## Overview

The project-level directory feature allows users to organize their chats into projects. Each project can have a name, description, icon, and color. Users can create, view, update, and delete projects, as well as associate chats with specific projects.

## Database Schema

The feature introduces a new `Project` table and updates the `Chat` table with a foreign key reference:

```typescript
// Project table
export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  icon: text('icon'),  // Stores icon name or emoji
  color: text('color'), // Stores color value
});

// Updated Chat table with projectId
export const chats = pgTable('chats', {
  id: uuid('id').defaultRandom().primaryKey(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  title: text('title').notNull(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id')
    .references(() => projects.id, { onDelete: 'set null' }),
});
```

## Backend Implementation

### Database Helpers

- `lib/db/project.ts` - Contains database helper functions for CRUD operations on projects
- `lib/db/chat.ts` - Extended with methods to create chats with project associations and to get chats by project

### API Endpoints

The feature includes the following RESTful API endpoints:

- `GET /api/projects` - Get all projects for the current user
- `POST /api/projects` - Create a new project
- `GET /api/projects/[id]` - Get a specific project
- `PATCH /api/projects/[id]` - Update a project
- `DELETE /api/projects/[id]` - Delete a project
- `GET /api/projects/[id]/chats` - Get all chats associated with a specific project

All endpoints include authentication using session cookies and validate that the user has access to the requested resources.

## Frontend Components

### Project List

The `ProjectList` component displays all projects for the current user and provides an interface to create new projects.

- Location: `components/project/project-list.tsx`
- Features: Loading states, empty state, project creation button

### Project Item

The `ProjectItem` component represents an individual project in the list.

- Location: `components/project/project-item.tsx`
- Features: Displays project icon, name, and color; handles selection; shows project menu

### Project Menu

The `ProjectMenu` component provides a dropdown menu for project management actions.

- Location: `components/project/project-menu.tsx`
- Features: Edit and delete actions, confirmation dialogs

### Create Project Dialog

The `CreateProjectDialog` component is a modal form for creating new projects.

- Location: `components/project/create-project-dialog.tsx`
- Features: Form validation using react-hook-form and zod, input fields for project details

## Authentication

User authentication is implemented using session cookies. Each API request validates the session cookie to ensure the user is authenticated before processing the request.

## Error Handling

The API implements standardized error responses with appropriate HTTP status codes:
- 400 - Bad Request (validation errors)
- 401 - Unauthorized (missing or invalid session)
- 403 - Forbidden (user doesn't own the resource)
- 404 - Not Found (resource not found)
- 500 - Server Error (unexpected errors)

## Future Enhancements

Potential future enhancements for the project-level directory feature:

1. Project sharing and collaboration features
2. Project archiving functionality
3. Project templates
4. Bulk operations for moving chats between projects
5. Project statistics and analytics

## Migration Notes

When running migrations for the schema changes, note that there might be conflicts with existing columns. Manual resolution of migration files may be required in some cases.
