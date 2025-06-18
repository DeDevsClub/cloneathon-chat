# Core Requirements

> This document outlines the **core requirements** for the AI chat application. These features represent the **minimum functionality** needed to qualify for a prize for the [T3 Cloneathon](https://cloneathon.t3.chat).

# 1. Chat with Various LLMs

> Implement support for multiple language models and providers.

## Model Integration

- [ ] Connect multiple AI providers (`OpenAI`, `Anthropic`, `Mistral`, `Gemini`, etc.).
- [ ] Support various model versions from each provider.
- [ ] Create abstraction layer to handle different API formats and requirements.

## API Management

- [x] Secure API keys handling using environment variables.
- [x] Implementation of rate limiting and usage tracking.
- [] Fallback mechanisms when specific models are unavailable.

## Model Selection

- [x] User interface for selecting preferred model.
- [x] Model switching without losing conversation context.
- [ ] Displaying model capabilities and limitations.

## Response Handling

- [ ] Support streaming responses when available.
- [ ] Proper error handling for failed requests.
- [ ] Content filtering options based on model capabilities.

### User Experience (UX)

- [x] **Model Selection UI**: Clean dropdown or card-based interface for choosing models.
- [x] **Transparent Indicators**: Visual feedback showing which model is currently active.
- [ ] **Performance Metrics**: Optional display of response times and token usage.
- [ ] **Model Comparison**: Ability to ask the same question to different models side by side.

# 2. Authentication & Sync

> User authentication with chat history synchronization.

## Authentication Methods

- [x] Email/password authentication.
- [ ] OAuth integration with popular providers (`Google`, `GitHub`, etc.).
- [x] Session management and secure token handling.
- [x] Secure password storage using bcrypt.

## User Management

- [ ] User profiles with customizable settings.
- [ ] Role-based access control if needed.
- [ ] Account recovery mechanisms.

## Chat Synchronization

- [x] Real-time **synchronization** across devices.
- [ ] Conflict resolution for simultaneous edits.
- [ ] Offline support with **local storage** fallback.

## Data Storage

- [x] Secure database for user data and chat history.
- [x] Encryption for sensitive information.
- [x] Regular **backups** and **data recovery options**.

### User Experience (UX)

- [x] **Seamless Login**: Straightforward authentication flow with minimal friction.
- [x] **Cross-device Access**: Consistent experience across multiple devices.
- [x] **Persistent Sessions**: Maintaining logged-in state appropriately.
- [x] **History Access**: Intuitive interface for accessing and searching past conversations.
- [ ] **Privacy Controls**: Options for users to manage or delete their data.

# 3. Chat Interface

> Provide an intuitive and responsive chat interface for user interactions.

## Message Components

- [x] User and AI message bubbles with clear visual distinction.
- [x] Support for markdown formatting in messages.
- [x] Timestamps and read receipts (`cha-ching`).

## Input Features

- [ ] Text input with **auto-complete** and **suggestions**.
- [x] Support for keyboard shortcuts (`ctrl + enter`).
- [ ] Character/token count indicators.

## User Experience (UX)

- [x] **Clean Design**: Minimalist interface with focus on the conversation.
- [x] **Responsive Layout**: Adapts to different screen sizes and orientations.
- [x] **Accessibility**: Keyboard navigation and screen reader support.
- [x] **Theme Support**: Light and dark mode options.

# 4. Message History

> Store and display conversation history for ongoing context.

## Storage Solution

- [x] Efficient database schema for conversation storage.
- [x] Pagination for long conversations.
- [ ] Message threading capabilities.

## Context Management

- [x] Maintaining conversation context across sessions.
- [ ] Context window optimization for token limitations.
- [ ] Support for conversation summarization.

## User Experience (UX)

- [x] **Conversation List**: Easy-to-navigate list of past conversations.
- [ ] **Search Functionality**: Find specific messages or conversations quickly.
- [x] **History Organization**: Options to categorize or tag conversations.
- [ ] **Export Options**: Ability to export conversations in common formats.

# 5. Real-time Updates

> Provide instant feedback and updates to enhance user experience.

## Websocket Integration

- [x] Real-time message delivery.
- [x] Typing indicators.

## Notification System

- [ ] In-app notifications.
- [ ] Browser notifications (`with permission`, ofc).
- [ ] Email digests for _important_ updates...😏

## User Experience (UX)

- [x] **Instant Feedback**: Visual cues for message delivery and reading.
- [x] **Typing Indicators**: Show when AI is generating a response.
- [ ] **Status Updates**: Clear indicators for connection status.

# 6. Responsive Design

> Ensure the application works well across all device types and screen sizes.

## Mobile-First Approach

- [x] Touch-friendly interface elements.
- [x] Efficient use of screen real estate.
- [x] Consideration for network constraints.

## Cross-Browser Compatibility

- [x] Testing across major browsers (Chrome, Firefox, Safari, Edge, etc.).
- [x] Progressive enhancement for newer features.
- [x] Fallbacks for older browsers (IE 11, etc.).

## User Experience (UX)

- [x] **Consistent Experience**: Similar functionality across devices.
- [x] **Adaptive Layout**: UI elements that reposition based on screen size.
- [x] **Touch Optimization**: Appropriately sized touch targets for mobile.
- [ ] **Offline Support**: Basic functionality when network connectivity is limited.

---

## Technical Implementation Guidelines

- [x] Build using Next.js with the App Router for optimal performance and SEO.
- [x] Use Shadcn UI components styled with Tailwind CSS for consistent design.
- [x] Follow Prisma schema design best practices for the database layer.
- [x] Implement proper state management using React Context.
- [x] Ensure all code follows the Airbnb Style Guide with named exports for components.
- [x] Add comprehensive error handling and logging throughout the application.
