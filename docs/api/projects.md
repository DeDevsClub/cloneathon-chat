# Projects API Architecture

## Overview

The Projects API provides functionality for organizing chats into projects, allowing users to create, manage, and associate chats with projects. Projects serve as containers for related conversations and provide organizational structure for the chat application.

## Database Schema

### Project Table (`Project`)
```sql
{
  id: uuid (Primary Key, Auto-generated)
  name: varchar(255) NOT NULL
  description: text (Optional)
  createdAt: timestamp NOT NULL (Default: now())
  updatedAt: timestamp NOT NULL (Default: now())
  userId: uuid NOT NULL (Foreign Key -> User.id, Cascade Delete)
  icon: varchar(64) (Optional)
  color: varchar(32) (Optional)
}

-- Indexes
- project_userId_idx on userId
- project_createdAt_idx on createdAt
```

### Relationships
- **User → Projects**: One-to-Many (user.id → project.userId)
- **Project → Chats**: One-to-Many (project.id → chat.projectId)
- **Project → Messages**: One-to-Many (project.id → message.projectId)

## API Endpoints

### 1. GET /api/projects
**Purpose**: Retrieve all projects for the authenticated user

**Authentication**: Session-based (multiple cookie formats supported)
- `user-session`
- `next-auth.session-token`
- `__Secure-next-auth.session-token`
- `authjs.session-token`

**Execution Flow**:
1. Extract email from session cookies (tries multiple formats)
2. Validate user exists in database via `getUser(email)`
3. Fetch projects using `getProjects({ userId })`
4. Return projects ordered by `updatedAt DESC`

**Response**:
```json
{
  "projects": [
    {
      "id": "uuid",
      "name": "string",
      "description": "string",
      "userId": "uuid",
      "icon": "string",
      "color": "string",
      "createdAt": "timestamp",
      "updatedAt": "timestamp"
    }
  ]
}
```

### 2. POST /api/projects
**Purpose**: Create a new project for the authenticated user

**Request Body Schema**:
```typescript
{
  name: string (required, min: 1, max: 255)
  description?: string
  icon?: string
  color?: string
}
```

**Execution Flow**:
1. Extract and validate user session
2. Validate request body against Zod schema
3. Create project using `createProject()` function
4. Return created project with 201 status

### 3. GET /api/projects/[projectId]/chats
**Purpose**: Retrieve all chats associated with a specific project

**Authentication**: Session-based with ownership validation

**Execution Flow**:
1. Extract projectId from URL path
2. Validate user session
3. Check project ownership via `validateUserOwnership()`
4. Fetch project chats using `getProjectChats({ projectId })`
5. Return chats ordered by `createdAt DESC`

### 4. POST /api/projects/[projectId]/chats
**Purpose**: Create a new chat within a specific project

**Request Body Schema**:
```typescript
{
  id: string (UUID required)
  title: string (required, min: 1, max: 255)
  visibility: 'public' | 'private' (default: from constants)
  selectedChatModel?: string
  message?: {
    content?: string
  }
}
```

**Execution Flow**:
1. Validate user session and project ownership
2. Validate request body schema
3. Create chat with projectId association using `createChat()`
4. Return created chat with 201 status

## Database Query Functions

### Core Project Queries (`lib/db/project.ts`)

**getProject({ id })**:
- Fetches single project by ID
- Throws `ChatSDKError` if not found
- Used for ownership validation

**getProjects({ userId })**:
- Fetches all projects for a user
- Ordered by `updatedAt DESC`
- Used in main projects listing

**createProject({ name, description, userId, icon, color })**:
- Creates new project with provided data
- Returns created project record
- Handles database constraint errors

**updateProject({ id, name, description, icon, color })**:
- Updates existing project fields
- Validates project exists first
- Updates `updatedAt` timestamp automatically

**deleteProject({ id })**:
- Validates project exists
- Deletes project (cascades to related chats)
- Returns success confirmation

**getProjectChats({ projectId })**:
- Validates project exists first
- Fetches all chats for the project
- Ordered by `createdAt DESC`

**createDefaultProjectWithTutorial(userId)**:
- Creates welcome project for new users
- Includes tutorial chat with sample messages
- Used during user onboarding

### Enhanced Chat Queries (`lib/db/queries.ts`)

**getChatsWithProjectsByUserId({ id, limit, startingAfter, endingBefore })**:
- Complex query with LEFT JOIN to include project information
- Returns chats with project names, icons, colors
- Supports pagination via cursor-based approach
- Used for sidebar project grouping

**getChatsByProjectId({ projectId, userId })**:
- Fetches chats filtered by project and user
- Includes fallback for chats without projects
- Ordered by `createdAt DESC`

## Authentication & Authorization

### Session Management
The API uses a flexible authentication approach supporting multiple session cookie formats:

```typescript
const cookieNames = [
  'user-session',
  'next-auth.session-token', 
  '__Secure-next-auth.session-token',
  'authjs.session-token'
];
```

### Email Extraction
```typescript
async function extractEmailFromCookie(request, cookieName) {
  // Handles JWT tokens (NextAuth) and JSON cookies
  // Uses getToken() for JWT decoding
  // Falls back to JSON.parse() for simple cookies
}
```

### Ownership Validation
```typescript
async function validateUserOwnership(projectId, userEmail) {
  // 1. Fetch user by email
  // 2. Fetch project by ID  
  // 3. Verify project.userId === user.id
  // 4. Return user and project or error
}
```

## Error Handling

### Standardized Error Responses
- **401 Unauthorized**: Invalid or missing session
- **403 Forbidden**: User doesn't own the project
- **404 Not Found**: Project or user not found
- **400 Bad Request**: Invalid request body or validation errors
- **500 Internal Server Error**: Database or server errors

### Custom Error Types
Uses `ChatSDKError` for consistent error handling:
```typescript
throw new ChatSDKError('not_found:database', 'Project not found');
```

---

## Improvement Suggestions

### 1. **Authentication & Security**

**Current Issues**:
- Multiple authentication approaches create complexity
- Cookie extraction logic is duplicated across endpoints
- Debug logging exposes sensitive session data
- No rate limiting on project creation

**Improvements**:
- **Centralized Auth Middleware**: Create reusable authentication middleware
- **Remove Debug Logging**: Eliminate sensitive cookie logging in production
- **Rate Limiting**: Implement rate limits on project creation (e.g., 10 projects per hour)
- **Session Validation**: Standardize on single session format (NextAuth recommended)
- **CSRF Protection**: Add CSRF tokens for state-changing operations

```typescript
// Suggested middleware
export async function authenticateUser(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new Error('Unauthorized');
  }
  return session.user;
}
```

### 2. **API Design & REST Compliance**

**Current Issues**:
- Mixed concerns in single endpoints (GET projects vs project chats)
- Inconsistent response formats
- No proper HTTP caching headers
- Missing API versioning

**Improvements**:
- **Separate Endpoints**: Split `GET /api/projects/[id]/chats` from project details
- **Consistent Responses**: Standardize all responses with metadata
- **HTTP Caching**: Add `Cache-Control` headers for GET requests
- **API Versioning**: Implement `/api/v1/projects` structure
- **HATEOAS**: Include navigation links in responses

```typescript
// Suggested response format
{
  data: { /* actual data */ },
  meta: {
    timestamp: "2024-01-01T00:00:00Z",
    version: "v1"
  },
  links: {
    self: "/api/v1/projects/uuid"
  }
}
```

### 3. **Database Optimization**

**Current Issues**:
- No database connection pooling management
- Missing composite indexes for common queries
- No soft delete functionality
- Limited query optimization

**Improvements**:
- **Composite Indexes**: Add indexes for `(userId, updatedAt)` queries
- **Soft Deletes**: Implement `deletedAt` field instead of hard deletes
- **Connection Pooling**: Optimize database connection management
- **Query Caching**: Implement Redis cache for frequently accessed projects
- **Bulk Operations**: Add bulk project operations for admin use

```sql
-- Suggested indexes
CREATE INDEX project_user_updated_idx ON "Project"(userId, updatedAt DESC NULLS LAST);
CREATE INDEX project_active_idx ON "Project"(userId) WHERE deletedAt IS NULL;
```

### 4. **Data Validation & Types**

**Current Issues**:
- Basic Zod validation without detailed error messages
- No validation for icon/color format constraints
- Missing business logic validation (e.g., project name uniqueness)
- Type safety could be improved

**Improvements**:
- **Enhanced Validation**: Add format validation for icons and colors
- **Business Rules**: Enforce unique project names per user
- **Custom Validators**: Create reusable validation schemas
- **Type Generation**: Auto-generate TypeScript types from Zod schemas
- **Input Sanitization**: Add XSS protection for text fields

```typescript
// Enhanced validation
const projectSchema = z.object({
  name: z.string()
    .min(1, 'Project name is required')
    .max(255, 'Project name too long')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Invalid characters in project name'),
  description: z.string().max(1000, 'Description too long').optional(),
  icon: z.string().regex(/^[a-z-]+$/, 'Invalid icon format').optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional()
});
```

### 5. **Performance & Scalability**

**Current Issues**:
- No pagination on projects listing
- Inefficient N+1 queries possible
- No background job processing
- Limited error monitoring

**Improvements**:
- **Pagination**: Implement cursor-based pagination for projects
- **Query Optimization**: Use JOIN queries to prevent N+1 problems
- **Background Jobs**: Move heavy operations to background queues
- **Monitoring**: Add performance monitoring and error tracking
- **CDN Integration**: Cache static project assets

```typescript
// Suggested pagination
export async function getProjects({ 
  userId, 
  limit = 20, 
  cursor 
}: {
  userId: string;
  limit?: number;
  cursor?: string;
}) {
  // Implementation with cursor-based pagination
}
```

### 6. **Feature Enhancements**

**Current Limitations**:
- No project sharing/collaboration
- No project templates
- No project archiving
- Limited project metadata

**Suggested Features**:
- **Project Sharing**: Add member management and permissions
- **Project Templates**: Create reusable project templates
- **Project Archives**: Soft delete with archive/restore functionality  
- **Project Analytics**: Track usage statistics and metrics
- **Project Tags**: Add tagging system for better organization
- **Bulk Operations**: Mass project management capabilities

### 7. **Testing & Documentation**

**Current State**:
- Limited test coverage
- No API documentation
- No integration tests

**Improvements**:
- **Unit Tests**: Comprehensive test coverage for all functions
- **Integration Tests**: Test complete API workflows
- **API Documentation**: OpenAPI/Swagger documentation
- **E2E Tests**: Browser-based testing for project workflows
- **Performance Tests**: Load testing for high-traffic scenarios

### 8. **Security Enhancements**

**Recommendations**:
- **Input Validation**: Stronger validation and sanitization
- **SQL Injection**: Ensure all queries use parameterized statements
- **Access Control**: Implement role-based permissions
- **Audit Logging**: Track all project modifications
- **Data Encryption**: Encrypt sensitive project data at rest

This architecture provides a solid foundation for project management but would benefit significantly from the suggested improvements to enhance security, performance, and maintainability.
