/**
 * Centralized route definitions for the application
 * This helps maintain consistent routing throughout the app
 */

export const AppRoutes = {
  // Home
  home: '/',

  // Projects
  projects: {
    list: '/projects',
    detail: (id: string) => `/projects/${id}`,
    edit: (id: string) => `/projects/${id}/edit`,
    new: '/projects/new',
  },

  // Chats
  chats: {
    list: () => `/chats`,
    projectChat: {
      list: () => `/chats`,
      detail: (chatId: string) => `/chats/${chatId}`,
      new: () => `/chats/new`,
    },
    detail: (id: string) => `/chats/${id}`,
    new: '/chats/new',
  },

  // API Routes
  api: {
    chat: {
      base: '/api/chat',
      byId: (id: string) => `/api/chat/${id}`,
      project: '/api/chat/project',
      messages: (chatId: string) => `/api/chat/${chatId}/messages`,
      history: (chatId: string) => `/api/chat/${chatId}/history`,
    },
    projects: {
      base: '/api/projects',
      byId: (id: string) => `/api/projects/${id}`,
      chats: (id: string) => `/api/projects/${id}/chats`,
    },
    test: {
      endpoints: '/api/test-endpoints',
    },
    api: {
      chat: {
        base: '/api/chat',
        byId: (id: string) => `/api/chat/${id}`,
        project: '/api/chat/project',
        messages: (chatId: string) => `/api/chat/${chatId}/messages`,
        history: (chatId: string) => `/api/chat/${chatId}/history`,
      },
    },
    chatProject: {
      update: '/api/chat/project',
    },
    chatVisibility: {
      update: '/api/chat/visibility',
    },
    chatModel: {
      update: '/api/chat/model',
    },
    chatVote: {
      update: '/api/chat/vote',
    },
    chatHistory: {
      update: '/api/chat/history',
    },
    chatMessage: {
      update: '/api/chat/message',
    },
    artifact: {
      update: '/api/artifact',
    },
    ai: {
      chat: '/api/ai/chat',
    },
    vote: {
      update: '/api/vote',
    },
  },
};

/**
 * Helper function to navigate to a chat within a project context
 */
export function navigateToProjectChat(chatId: string): string {
  return AppRoutes.chats.projectChat.detail(chatId);
}

/**
 * Helper function to navigate to chat creation within a project
 */
export function navigateToNewProjectChat(): string {
  return AppRoutes.chats.projectChat.new();
}

/**
 * Helper function to get the API endpoint for chat history
 */
export function getChatHistoryEndpoint(chatId: string): string {
  return AppRoutes.api.chat.history(chatId);
}

/**
 * Helper function to get the API endpoint for chat messages
 */
export function getChatMessagesEndpoint(chatId: string): string {
  return AppRoutes.api.chat.messages(chatId);
}

/**
 * Examples of how to use the routes
 *
 * Example 1: View an existing chat in a project context
 * Given a projectId "proj_12345" and chatId "chat_67890":
 * const chatUrl = navigateToProjectChat("proj_12345", "chat_67890");
 * // Result: "/projects/proj_12345/chats/chat_67890"
 *
 * Example 2: Fetch chat history using the API endpoint
 * const historyEndpoint = getChatHistoryEndpoint("chat_67890");
 * // Result: "/api/chat/chat_67890/history"
 *
 * Example 3: Create a new chat in a project
 * const newChatUrl = navigateToNewProjectChat("proj_12345");
 * // Result: "/projects/proj_12345/chats/new"
 */
