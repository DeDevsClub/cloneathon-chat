export interface SlashCommand {
  name: string;
  description: string;
  icon?: string;
  aliases?: string[];
  category?: 'chat' | 'navigation' | 'tools' | 'ai';
  action: (args?: string) => void | Promise<void>;
  suggestions?: () => Promise<
    { id: string; name: string; description?: string }[]
  >;
}

export interface SlashCommandConfig {
  trigger: string; // The character that triggers commands (default: '/')
  maxSuggestions: number;
  showCategories: boolean;
}

export const defaultConfig: SlashCommandConfig = {
  trigger: '/',
  maxSuggestions: 8,
  showCategories: true,
};

// Fetch projects for suggestions
const fetchProjectSuggestions = async (): Promise<
  { id: string; name: string; description?: string }[]
> => {
  try {
    const response = await fetch('/api/projects');
    if (!response.ok) {
      throw new Error('Failed to fetch projects');
    }
    const data = await response.json();
    return (data.projects || []).map((project: any) => ({
      id: project.id,
      name: project.name,
      description: project.description || `Project ${project.name}`,
    }));
  } catch (error) {
    console.error('Error fetching project suggestions:', error);
    return [];
  }
};

// Fetch available models for suggestions
const fetchModelSuggestions = async (): Promise<
  { id: string; name: string; description?: string }[]
> => {
  try {
    // Import chatModels from the models file
    const { chatModels } = await import('@/lib/ai/models');
    return chatModels.map((model) => ({
      id: model.id,
      name: model.name,
      description: `${model.description} (${model.model})`,
    }));
  } catch (error) {
    console.error('Error fetching model suggestions:', error);
    // Fallback to hardcoded models if import fails
    return [
      {
        id: 'chat-model',
        name: 'Chat',
        description: 'Primary model for all-purpose chat (gpt-4o)',
      },
      {
        id: 'chat-model-reasoning',
        name: 'Reasoning',
        description:
          'Uses Groq Llama for advanced reasoning (llama-3.1-70b-versatile)',
      },
    ];
  }
};

// Fetch available tools for suggestions
const fetchToolSuggestions = async (): Promise<
  { id: string; name: string; description?: string }[]
> => {
  try {
    // Define available tools with descriptions
    const tools = [
      {
        id: 'web-search',
        name: 'Web Search',
        description: 'Toggle web search functionality for enhanced responses',
      },
      {
        id: 'code-interpreter',
        name: 'Code Interpreter',
        description: 'Enable code execution and analysis capabilities',
      },
      {
        id: 'image-generator',
        name: 'Image Generator',
        description: 'Generate images from text descriptions',
      },
      {
        id: 'file-upload',
        name: 'File Upload',
        description: 'Upload and analyze files (images, documents, code)',
      },
      {
        id: 'canvas-mode',
        name: 'Canvas Mode',
        description: 'Interactive canvas for visual editing and creation',
      },
      {
        id: 'artifacts',
        name: 'Artifacts',
        description: 'Generate and manage code artifacts and components',
      },
    ];

    return tools;
  } catch (error) {
    console.error('Error fetching tool suggestions:', error);
    return [];
  }
};

// Available slash commands
export const createSlashCommands = (handlers: {
  onNewChat: () => void;
  onClearChat: () => void;
  onToggleWebSearch: () => void;
  onSwitchModel: (modelId?: string) => void;
  onNavigateToProjects: () => void;
  onCreateProject: () => void;
  onSelectProject: (projectId: string) => void;
  onHelp: () => void;
  onToggleTool: (toolId?: string) => void;
}): SlashCommand[] => [
  {
    name: 'new',
    description: 'Create a new chat',
    icon: '💬',
    category: 'chat',
    action: handlers.onNewChat,
  },
  // {
  //   name: 'clear',
  //   description: 'Clear current chat',
  //   icon: '🗑️',
  //   aliases: ['reset'],
  //   category: 'chat',
  //   action: handlers.onClearChat,
  // },
  {
    name: 'search',
    description: 'Toggle web search',
    icon: '🌐',
    aliases: ['web'],
    category: 'tools',
    action: handlers.onToggleWebSearch,
  },
  {
    name: 'models',
    description: 'Switch AI model for chat',
    icon: '🤖',
    aliases: ['ai', 'switch'],
    category: 'ai',
    action: (args) => {
      if (args) {
        // If args provided, try to select model by name
        handlers.onSwitchModel(args);
      } else {
        // If no args, show model selection dialog
        handlers.onSwitchModel();
      }
    },
    suggestions: fetchModelSuggestions,
  },
  {
    name: 'projects',
    description: 'Go to projects',
    icon: '📁',
    aliases: ['p'],
    category: 'navigation',
    action: (args) => {
      if (args) {
        // If args provided (project selected from suggestions), navigate to specific project
        handlers.onSelectProject(args);
      } else {
        // If no args, go to projects page
        handlers.onNavigateToProjects();
      }
    },
    suggestions: fetchProjectSuggestions,
  },
  // {
  //   name: 'help',
  //   description: 'Show available commands',
  //   icon: '❓',
  //   aliases: ['?', 'commands'],
  //   category: 'chat',
  //   action: handlers.onHelp,
  // },
  {
    name: 'tools',
    description: 'Select and activate a specific tool',
    icon: '🛠️',
    category: 'tools',
    aliases: ['t'],
    action: (args) => {
      if (args) {
        // If args provided, try to select tool by name
        handlers.onToggleTool(args);
      } else {
        // If no args, show tool selection dialog
        handlers.onToggleTool();
      }
    },
    suggestions: fetchToolSuggestions,
  },
];

// Parse slash command from input
export const parseSlashCommand = (
  input: string,
  trigger: string,
): {
  isCommand: boolean;
  command?: string;
  args?: string;
  partial: boolean;
} => {
  if (!input.startsWith(trigger)) {
    return { isCommand: false, partial: false };
  }

  const commandPart = input.slice(trigger.length); // Remove trigger
  const spaceIndex = commandPart.indexOf(' ');

  if (spaceIndex === -1) {
    // No space found, still typing command
    return {
      isCommand: true,
      command: commandPart.toLowerCase(),
      partial: true,
    };
  }

  const command = commandPart.slice(0, spaceIndex).toLowerCase();
  const args = commandPart.slice(spaceIndex + 1);

  return {
    isCommand: true,
    command,
    args,
    partial: false,
  };
};

// Filter commands based on input
export const filterCommands = (
  commands: SlashCommand[],
  query: string,
): SlashCommand[] => {
  if (!query) return commands;

  const lowercaseQuery = query.toLowerCase();
  return commands.filter(
    (cmd) =>
      cmd.name.toLowerCase().includes(lowercaseQuery) ||
      cmd.description.toLowerCase().includes(lowercaseQuery) ||
      cmd.aliases?.some((alias) =>
        alias.toLowerCase().includes(lowercaseQuery),
      ),
  );
};

// Group commands by category
export const groupCommandsByCategory = (
  commands: SlashCommand[],
): Record<string, SlashCommand[]> => {
  return commands.reduce(
    (groups, command) => {
      const category = command.category || 'chat';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(command);
      return groups;
    },
    {} as Record<string, SlashCommand[]>,
  );
};
