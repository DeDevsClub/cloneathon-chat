# Changelog

All notable changes to the cloneathon-chat project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
