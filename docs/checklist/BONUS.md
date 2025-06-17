# Bonus Features

> This document outlines additional features that can be implemented to enhance the chat application. These features go beyond the core functionality and provide a richer, more engaging user experience.

# 1. Attachment Support

> Allows users to upload and share files within conversations.

- [x] **Storage**: Use a combination of local storage for development and cloud storage (like AWS S3 or Vercel Blob) for production.
- [x] **File Types**: Support common formats including images (.jpg, .png, .gif), documents (.pdf, .docx), and other media files.
- [x] **Size Limitations**: Implement a 10MB file size limit per upload to prevent abuse.
- [x] **Preview Support**: Generate thumbnails for images and previews for PDFs when possible.

### User Experience

- [x] Drag-and-drop (DnD) interface for easy uploads.
- [x] Progress indicators for large file uploads.
- [ ] Inline display of compatible file types.
- [ ] Download options for all attachments.

# 2. Syntax Highlighting

> Provides beautiful code formatting and highlighting for code snippets shared in conversations.

- [x] **Library**: Integrate `Prism.js` or `Highlight.js` with the Shadcn UI theme.
- [x] **Language Support**: Include popular programming languages like TypeScript, Python, SQL, and more.
- [ ] **Features**: Line numbers, copy-to-clipboard functionality, and language detection.

### User Experience

- [x] **Code blocks** are visually distinct from regular text.
- [x] **Syntax** is colored according to language rules.
- [x] Users can select a **language** or let the system auto-detect it.
- [x] **Dark/light mode** support that matches the application theme.

# 3. Chat Branching

> Enables users to create alternative conversation paths from any point in a chat.

- [ ] **Data Structure**: Graph-based conversation model instead of linear chat history.
- [ ] **State Management**: Use React Context to manage the complex state of branched conversations.
- [ ] **Storage**: Store conversation trees with references to parent/child relationships.

### User Experience

- [ ] **Visual indicator** showing branch points in conversations.
- [ ] **Branch creation** from any message with a simple UI action.
- [ ] **Navigation** between branches with breadcrumb-style indicators.
- [ ] **Ability** to merge branches back into the main conversation.

## 4. Image Generation Support

> Integrates AI-powered image generation directly within the chat interface.

- [ ] **API Integration**: Connect to image generation services like DALL-E, Stable Diffusion, and Midjourney API.
- [ ] **Prompt Handling**: Parse text commands within messages that trigger image generation.
- [ ] **Optimization**: Implement caching and size optimization for generated images.

### User Experience

- [ ] Special command syntax (e.g., `/imagine a sunset over mountains`).
- [ ] Loading states while images are being generated.
- [ ] Options to regenerate or modify images.
- [ ] Ability to save generated images to the user's device.

## 5. Resumable Streams

> Allows chat message generation to continue after page refreshes or connection interruptions.

- [ ] **Streaming Protocol**: Implement SSE (`Server-Sent Events`) or WebSockets for reliable connection.
- [ ] **Message Buffering**: Store partial messages server-side until fully delivered.
- [ ] **State Recovery**: Use session tokens to resume from exact point of interruption.

### User Experience

- [x] Seamless continuation of AI responses after browser refresh.
- [ ] Visual indicator showing resumption of previous response.
- [ ] Local storage backup of in-progress messages.
- [x] Connection status indicators for user awareness.

## 6. Chat Sharing

> Enables users to share entire conversations or specific message threads with others.

- [x] **Sharing Mechanism**: Generate unique, secure URLs for shared conversations.
- [x] **Permission Levels**: Configure read-only, comment-only, or full participation access.
- [ ] **Export Options**: Support for exporting chats as PDF, markdown, or plain text.

### User Experience

- [x] Simple **share button** that generates a link.
- [ ] Options to set expiration time for shared links.
- [ ] Preview of how shared conversation will appear to recipients.
- [ ] Integration with common social platforms and messaging apps.

# 7. Web Search Integration

> Incorporates real-time web search capabilities directly within the chat interface.

- [x] **Search API**: Integrate with search engines like Google Custom Search, Bing API, or DuckDuckGo.
- [x] **Result Parsing**: Extract and format relevant information from search results.
- [x] **Citation Handling**: Automatically add source links for information retrieved.

### User Experience

- [ ] **Trigger searches** with a special prefix (e.g., `/search climate change facts`).
- [x] **Display search results** inline within the conversation.
- [ ] Allow users to **request more detailed information** on specific results.
- [x] Option to **open full web pages in a side panel** without leaving the chat.

# 8. Collaborative Whiteboards (Creative Feature)

> Integrates interactive whiteboard functionality directly within chat conversations for visual collaboration.

- [x] **Canvas Technology**: Implement using HTML5 Canvas or a specialized library like Excalidraw.
- [ ] **Real-time Collaboration**: WebSocket-based synchronization for multi-user editing.
- [ ] **Object Types**: Support for basic shapes, text, connectors, and free-hand drawing.
- [ ] **Export**: Save whiteboards as images that can be shared in the conversation.

### User Experience

- [ ] **Trigger a whiteboard** with `/whiteboard` command.
- [ ] **Inline embedding** within the conversation flow.
- [ ] **Multiple users can draw simultaneously** with user-identified cursors.
- [ ] **Persistence of whiteboards across chat sessions**.
- [ ] **Option to continue working on previous whiteboards**.

---

## Implementation Priority

**Recommended order for implementing these bonus features**:

- [x] **Attachment Support** (relatively straightforward, high user value)
- [x] **Syntax Highlighting** (enhances developer-focused conversations)
- [x] **Chat Sharing** (increases user engagement through collaboration)
- [x] **Resumable Streams** (improves reliability of core functionality)
- [ ] **Image Generation Support** (adds creative capabilities)
- [x] **Web Search** (enhances information access)
- [ ] **Chat Branching** (complex but powerful feature)
- [ ] **Collaborative Whiteboards** (most complex, implement last)

### Technical Considerations

- [ ] All features should maintain compatibility with the existing `Next.js` app router structure.
- [ ] Implement proper **error handling** and **fallbacks** for each feature.
- [ ] Consider **accessibility** requirements for all new UI elements.
- [ ] Ensure each feature works well on both **desktop** and **mobile** interfaces.
- [x] Follow the established `Shadcn UI` and `Tailwind CSS` patterns for visual consistency.
