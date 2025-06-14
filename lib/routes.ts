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
    detail: (id: string) => `/chats/${id}`,
    new: '/chats/new',
  },

  // API Routes
  api: {
    chat: {
      base: '/api/chat',
      byId: (id: string) => `/api/chat/${id}`,
      messages: (chatId: string) => `/api/chat/${chatId}`,
      history: (chatId: string) => `/api/chat/${chatId}`,
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
        messages: (chatId: string) => `/api/chat/${chatId}`,
        history: (chatId: string) => `/api/chat/${chatId}`,
      },
    },
    chatProject: {
      update: '/api/chat',
    },
    // ai: {
    //   chat: '/api/ai/chat',
    // },
  },
};

/**
 * Helper function to navigate to a chat within a project context
 */
export function navigateToProjectChat(chatId: string): string {
  return AppRoutes.chats.detail(chatId);
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
 * Given a chatId "chat_67890":
 * const chatUrl = navigateToProjectChat("chat_67890");
 * // Result: "/chats/chat_67890"
 *
 * Example 2: Fetch chat history using the API endpoint
 * const historyEndpoint = getChatHistoryEndpoint("chat_67890");
 * // Result: "/api/chat/chat_67890"
 */
