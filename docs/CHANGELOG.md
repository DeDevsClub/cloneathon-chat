# Changelog

All notable changes to the cloneathon-chat project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

### Changed

### Fixed

---

## [0.2.0] - 2025-06-15

### Added
- **Project Organization:**
    - Implemented project-level directory feature for organizing chats.
    - Users can create, update, and delete projects with custom names, descriptions, icons, and colors.
    - Chats can now be associated with specific projects.
    - Added API endpoints for project management (`/api/projects`) and chat associations.
    - Developed UI components for listing, creating, and managing projects.
- **Enhanced Chat Functionality:**
    - Simplified chat API (`POST /api/chats`) using `@ai-sdk/openai` for direct AI response streaming.
    - Guest user detection and handling in project creation dialogs and new project pages.
    - Welcoming hero component on `app/chats/page.tsx` for users with no existing chats.
- **Database Enhancements:**
    - Added `systemPrompt`, `model`, and `lastActivityAt` columns to the `chats` table.
    - Default values for system prompts and models in chat/message saving queries (`lib/db/queries.ts`).
- **UI Improvements:**
    - Improved styling for chat items and general UI responsiveness.
    - `app/chats/page.tsx` now uses `useSession` for session management and fetches chat history with authorization headers.

### Changed
- **Authentication and Authorization:**
    - Updated authentication approach in API routes to consistently use session cookies.
    - Refactored `middleware.ts` for clearer authentication and authorization logic, including improved handling for guest users, admin routes (using `AUTHORIZED_EMAILS` environment variable), and protected routes.
    - Simplified chat routes to `/chats/:chatId` instead of nested project URLs.
    - Middleware now handles redirection for unauthorized access more effectively.
- **Backend and API:**
    - Streamlined persistence logic for messages and chats, with some parts refactored or commented out, potentially shifting message saving responsibilities.
- **Database Schema:**
    - Enhanced database schema with a new `Project` table and its relations to support project features.
- **Frontend Development:**
    - Chat creation workflow extended to support project association.
    - Client-side management of chat state and UI responsiveness emphasized.
    - Adopted feature-based code organization for better maintainability.
- **Documentation:**
    - Comprehensively updated `ARCHITECTURE.md` to reflect the current system architecture, including API changes, middleware logic, component breakdown, workflows, and dependencies.

### Fixed
- **Middleware:**
    - Resolved syntax errors and lint issues in `middleware.ts`.
    - Corrected a critical bug in authorization check related to `token.email` and `AUTHORIZED_EMAIL` (now correctly using `AUTHORIZED_EMAILS`).
- **API Endpoints:**
    - Addressed duplicate validation check in the project deletion API endpoint.
    - Ensured consistent session handling in API routes for authentication.
    - Updated project deletion API endpoint for robust project removal.
- **Frontend:**
    - Corrected redirection logic for guest users attempting restricted actions (e.g., project creation now correctly redirects to login).

---

## [0.1.0] - 2025-06-13

### Added

- Modern, interactive login page with animations and improved UX
- Redesigned signup page with matching styling and interactions
- Iconify integration for elegant form icons
- Loading and success states for authentication flows
- Subtle animated gradient backgrounds on auth pages
- Consistent error handling with toast notifications

### Changed

- Updated auth form styling with improved layout and placeholders
- Improved NextAuth integration with proper async/await handling
- Enhanced form validation and error messages
- Unified styling between login and signup pages
- Rebranded interface elements to 'th3.chat'
- Optimized styling for both light and dark themes

### Fixed

- Login functionality with proper response handling and redirection
- Fixed route references from '/register' to '/signup'
- Resolved TypeScript errors in auth components
- Improved form submission UX with proper loading states
- Fixed migration scripts to use postgres-js and drizzle-orm

## [0.0.1] - 2025-06-13

### Added

- Initial application structure with Next.js and App Router
- Basic authentication flow with NextAuth
- Chat functionality with AI integration
- Document and conversation history management
- Database integration with Drizzle ORM
- Initial UI components with Shadcn/UI
