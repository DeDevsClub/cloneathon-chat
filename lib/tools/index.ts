import { webSearchTool } from './web-search';
import { imageGenerationTool } from './image-generation';

export { webSearchTool, imageGenerationTool };

// All available tools
export const availableTools = {
  webSearch: webSearchTool,
  imageGeneration: imageGenerationTool,
};

// Get tools based on enabled state
export const getEnabledTools = (toolsEnabled: boolean) => {
  if (!toolsEnabled) {
    return undefined;
  }

  return {
    webSearch: webSearchTool,
    imageGeneration: imageGenerationTool,
  };
};
