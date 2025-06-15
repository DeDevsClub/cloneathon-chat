import { webSearchTool } from './web-search';

export { webSearchTool };

// All available tools
export const availableTools = {
  webSearch: webSearchTool,
};

// Get tools based on enabled state
export const getEnabledTools = (toolsEnabled: boolean) => {
  if (!toolsEnabled) {
    return undefined;
  }
  
  return {
    webSearch: webSearchTool,
  };
};
