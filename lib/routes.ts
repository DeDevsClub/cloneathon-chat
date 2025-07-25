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
    detail: (projectId: string) => `/projects/${projectId}`,
    edit: (projectId: string) => `/projects/${projectId}/edit`,
    new: '/projects/new',
    chat: (projectId: string) => `/projects/${projectId}`,
  },

  // Chats
  chats: {
    list: () => `/chats`,
    detail: (chatId: string) => `/chats/${chatId}`,
    new: '/chats/new',
  },

  // API Routes
  api: {
    chats: {
      base: '/api/chats',
      byId: (chatId: string) => `/api/chats/${chatId}`,
      messages: (chatId: string) => `/api/chats/${chatId}`,
      history: (chatId: string) => `/api/chats/${chatId}`,
    },
    projects: {
      base: '/api/projects',
      byId: (projectId: string) => `/api/projects/${projectId}`,
      new: '/api/projects/new',
      chats: (projectId: string) => `/api/projects/${projectId}/chats`,
    },
    test: {
      endpoints: '/api/test-endpoints',
    },
  },
};

/**
 * Helper function to navigate to a chat within a project context
 */
export function navigateToProjectChat(
  projectId: string,
  chatId: string,
): string {
  return AppRoutes.api.projects.chats(projectId);
}

/**
 * Helper function to get the API endpoint for chat history
 */
export function getChatHistoryEndpoint(chatId: string): string {
  return AppRoutes.api.chats.history(chatId);
}

/**
 * Helper function to get the API endpoint for chat messages
 */
export function getChatMessagesEndpoint(chatId: string): string {
  return AppRoutes.api.chats.messages(chatId);
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
 * // Result: "/api/chats/chat_67890"
 */
