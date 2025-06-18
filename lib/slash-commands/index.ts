export interface SlashCommand {
  name: string;
  description: string;
  icon?: string;
  aliases?: string[];
  category?: 'chat' | 'navigation' | 'tools' | 'ai';
  action: (args?: string) => void | Promise<void>;
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

// Available slash commands
export const createSlashCommands = (handlers: {
  onNewChat: () => void;
  onClearChat: () => void;
  onToggleWebSearch: () => void;
  onSwitchModel: (modelId?: string) => void;
  onNavigateToProjects: () => void;
  onCreateProject: () => void;
  onHelp: () => void;
}): SlashCommand[] => [
  {
    name: 'new',
    description: 'Create a new chat',
    icon: '💬',
    category: 'chat',
    action: handlers.onNewChat,
  },
  {
    name: 'clear',
    description: 'Clear current chat',
    icon: '🗑️',
    aliases: ['reset'],
    category: 'chat',
    action: handlers.onClearChat,
  },
  {
    name: 'search',
    description: 'Toggle web search',
    icon: '🌐',
    aliases: ['web'],
    category: 'tools',
    action: handlers.onToggleWebSearch,
  },
  {
    name: 'model',
    description: 'Switch AI model',
    icon: '🤖',
    aliases: ['ai', 'switch'],
    category: 'ai',
    action: (args) => handlers.onSwitchModel(args),
  },
  {
    name: 'projects',
    description: 'Go to projects',
    icon: '📁',
    aliases: ['proj'],
    category: 'navigation',
    action: handlers.onNavigateToProjects,
  },
  {
    name: 'project',
    description: 'Create new project',
    icon: '➕',
    aliases: ['newproj'],
    category: 'navigation',
    action: handlers.onCreateProject,
  },
  {
    name: 'help',
    description: 'Show available commands',
    icon: '❓',
    aliases: ['?', 'commands'],
    category: 'chat',
    action: handlers.onHelp,
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
