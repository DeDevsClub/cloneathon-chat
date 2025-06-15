# Projects

# Project-Level Chat Directory Implementation Plan

## Overview

This document outlines the plan for implementing project-level organization of chats in the cloneathon-chat application. This feature will allow users to create projects and organize their chats within these projects, providing better organization and management of conversations.

## 1. Database Schema Updates

### New Table: Project

```typescript
export const project = pgTable("Project", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  icon: varchar("icon", { length: 64 }),
  color: varchar("color", { length: 32 }),
});

export const projectRelations = relations(project, ({ one, many }) => ({
  user: one(user, {
    fields: [project.userId],
    references: [user.id],
  }),
  chats: many(chat),
}));
```

### Update Chat Table

Modify the existing `chat` table to include an optional project reference:

```typescript
export const chat = pgTable("Chat", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  title: varchar("title", { length: 255 }),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  visibility: varchar("visibility", { length: 10 })
    .default("private")
    .notNull(),
  projectId: uuid("projectId").references(() => project.id, {
    onDelete: "set null",
  }),
});

// Update chat relations to include project
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
}));
```

## 2. Backend Code Changes

### API Endpoints

#### Project Management

1. **Create Project**

   - Route: `POST /api/projects`
   - Functionality: Creates a new project for the authenticated user

2. **Get Projects**

   - Route: `GET /api/projects`
   - Functionality: Retrieves all projects for the authenticated user

3. **Get Project**

   - Route: `GET /api/projects/[id]`
   - Functionality: Retrieves a specific project by ID

4. **Update Project**

   - Route: `PATCH /api/projects/[id]`
   - Functionality: Updates project details (name, description, icon, color)

5. **Delete Project**
   - Route: `DELETE /api/projects/[id]`
   - Functionality: Deletes a project (optionally moves chats to "No Project" or deletes them)

#### Chat Management

1. **Update Chat Project**

   - Route: `PATCH /api/chats/[id]`
   - Functionality: Updates which project a chat belongs to

2. **Get Chats by Project**

   - Route: `GET /api/projects/[id]/chats`
   - Functionality: Retrieves all chats belonging to a specific project

### Database Functions

1. Create helper functions in `lib/db/project.ts` for CRUD operations on projects:

   - `createProject`
   - `getProjects`
   - `getProject`
   - `updateProject`
   - `deleteProject`
   - `getProjectChats`

2. Update chat functions in `lib/db/chat.ts` to support project operations:
   - `updateChatProject`
   - Modify `getChats` to support filtering by project
   - Update `createChat` to accept optional projectId

## 3. Frontend UI Updates

### Components

#### New Components

1. **Project Management**

   - `components/project/project-list.tsx`: Lists all projects
   - `components/project/project-item.tsx`: Individual project item
   - `components/project/project-form.tsx`: Create/edit project form
   - `components/project/project-menu.tsx`: Actions menu for project

2. **Project-Chat Integration**
   - `components/navigation/project-selector.tsx`: Dropdown to select project when creating chat
   - `components/navigation/project-sidebar.tsx`: Sidebar navigation organized by projects

#### Component Updates

1. **Sidebar**

   - Update `components/app-sidebar.tsx` to include projects section
   - Add project filtering/navigation in sidebar

2. **Chat Components**
   - Update `components/chat/chat-header.tsx` to display project info
   - Add project selection to chat creation flow

### Pages

1. **Project Management**

   - `app/(chat)/projects/page.tsx`: Lists all projects
   - `app/(chat)/projects/[id]/page.tsx`: Project details page that lists its chats
   - `app/(chat)/projects/new/page.tsx`: Create new project form

2. **Updated Chat Pages**
   - Modify existing chat pages to handle project context

### UI Elements and Features

1. **Project Navigation**

   - Projects dropdown in sidebar
   - Project filtering and sorting
   - Project-based chat organization

2. **Project Creation and Management**

   - Form for creating/editing projects
   - Project color and icon selection
   - Drag and drop for organizing chats between projects

3. **Visual Indicators**
   - Color coding for chats belonging to specific projects
   - Project badges on chat items

## 4. State Management

1. **Context Updates**

   - Add project context to track active project
   - Update chat context to include project information

2. **UI State**
   - Project selection state
   - Project filter state

## 5. Implementation Plan

### Phase 1: Database Setup

1. Create database migration for project table
2. Add projectId field to chat table
3. Update database relation definitions

### Phase 2: Backend API

1. Implement project CRUD endpoints
2. Update chat endpoints to support project filters
3. Create database helper functions

### Phase 3: Frontend UI - Core

1. Create basic project components
2. Update sidebar to include projects section
3. Add project selection to chat creation

### Phase 4: Frontend UI - Enhanced

1. Implement project management pages
2. Add drag and drop between projects
3. Implement project filtering and sorting

### Phase 5: Testing & Refinement

1. Test user flows and edge cases
2. Optimize performance
3. Refine UI/UX

## 6. Technical Considerations

### Data Migration

- Plan for migrating existing chats (can remain unassigned or assigned to a default project)

### Performance

- Optimize queries for projects with many chats
- Consider pagination for chat listing by project

### Security

- Ensure proper access control to prevent unauthorized access to projects
- Validate project ownership in all endpoints

### User Experience

- Default project view for new users
- Intuitive navigation between projects
- Clear visual distinction between projects
