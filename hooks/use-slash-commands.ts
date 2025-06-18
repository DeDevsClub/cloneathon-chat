import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  SlashCommand,
  SlashCommandConfig,
  createSlashCommands,
  parseSlashCommand,
  filterCommands,
  defaultConfig,
} from '@/lib/slash-commands';

interface UseSlashCommandsProps {
  onClearChat?: () => void;
  onToggleWebSearch?: () => void;
  onSwitchModel?: (modelId?: string) => void;
  onToggleTool?: (toolId?: string) => void;
}

export function useSlashCommands({
  onClearChat,
  onToggleWebSearch,
  onSwitchModel,
  onToggleTool,
}: UseSlashCommandsProps) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeCommand, setActiveCommand] = useState<
    SlashCommand | undefined
  >();
  const [suggestionCount, setSuggestionCount] = useState(0);
  const config: SlashCommandConfig = defaultConfig;

  const commands = createSlashCommands({
    onNewChat: () => {
      router.push('/chats/new');
      toast.success('Creating new chat...');
    },
    onClearChat: () => {
      onClearChat?.();
      toast.success('Chat cleared');
    },
    onToggleWebSearch: () => {
      onToggleWebSearch?.();
    },
    onSwitchModel: (modelId?: string) => {
      if (modelId) {
        onSwitchModel?.(modelId);
        toast.success(`Switched to ${modelId}`);
      } else {
        onSwitchModel?.();
      }
    },
    onNavigateToProjects: () => {
      router.push('/projects');
      toast.success('Navigating to projects...');
    },
    onCreateProject: () => {
      router.push('/projects');
      toast.info('Create a new project from the projects page');
    },
    onSelectProject: (projectId: string) => {
      // Navigate to specific project or create new chat in project
      router.push(`/chats/new?projectId=${projectId}`);
      toast.success('Creating new chat in project...');
    },
    onHelp: () => {
      toast.info(
        'Available commands: /new, /clear, /search, /model, /projects, /project, /help',
      );
    },
    onToggleTool: (toolId?: string) => {
      onToggleTool?.(toolId);
    },
  });

  const handleInputChange = (input: string): { shouldClear: boolean } => {
    const parsed = parseSlashCommand(input, config.trigger);
    console.log('Parsed command:', parsed);

    if (parsed.isCommand) {
      setQuery(parsed.command || '');
      setIsVisible(true);
      setSelectedIndex(0);

      // Check if this is a command match for suggestions
      const exactCommand = commands.find(
        (cmd) =>
          cmd.name === parsed.command ||
          cmd.aliases?.includes(parsed.command || ''),
      );
      
      console.log('Exact command found:', exactCommand?.name, 'Has suggestions:', !!exactCommand?.suggestions, 'Args:', parsed.args);

      if (exactCommand && exactCommand.suggestions && !parsed.args) {
        // Show suggestions for this command when no args are provided
        setActiveCommand(exactCommand);
        console.log('Setting active command:', exactCommand.name);
      } else {
        setActiveCommand(undefined);
        console.log('No active command set');
      }
    } else {
      setIsVisible(false);
      setQuery('');
      setActiveCommand(undefined);
    }

    return { shouldClear: false };
  };

  const handleKeyDown = (event: React.KeyboardEvent): boolean => {
    if (!isVisible) return false;

    const filteredCommands = activeCommand?.suggestions
      ? [] // When showing suggestions, don't show regular commands
      : filterCommands(commands, query);

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (activeCommand?.suggestions) {
          // Navigate down through suggestions
          setSelectedIndex((prev) =>
            prev >= suggestionCount - 1 ? 0 : prev + 1,
          );
        } else {
          // Navigate down through commands
          setSelectedIndex((prev) =>
            prev >= Math.min(filteredCommands.length, config.maxSuggestions) - 1
              ? 0
              : prev + 1,
          );
        }
        return true;

      case 'ArrowUp':
        event.preventDefault();
        if (activeCommand?.suggestions) {
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : suggestionCount - 1,
          );
        } else {
          setSelectedIndex((prev) =>
            prev === 0
              ? Math.min(filteredCommands.length, config.maxSuggestions) - 1
              : prev - 1,
          );
        }
        return true;

      case 'Enter':
        event.preventDefault();
        if (activeCommand?.suggestions) {
          // Handle suggestion selection
          // We need to get the suggestions first, then select the right one
          if (activeCommand.suggestions) {
            activeCommand.suggestions().then((suggestions) => {
              if (suggestions.length > 0 && selectedIndex < suggestions.length) {
                const selectedSuggestion = suggestions[selectedIndex];
                selectCommand(activeCommand, selectedSuggestion.id);
              }
            }).catch((error) => {
              console.error('Error getting suggestions:', error);
            });
          }
          return true;
        } else if (filteredCommands.length > 0) {
          const command = filteredCommands[selectedIndex];
          if (command) {
            selectCommand(command);
          }
        }
        return true;

      case 'Escape':
      case 'Tab':
        event.preventDefault();
        close();
        return true;

      default:
        return false;
    }
  };

  const selectCommand = useCallback((command: SlashCommand, args?: string) => {
    setIsVisible(false);
    setQuery('');
    setSelectedIndex(0);
    setActiveCommand(undefined);
    setSuggestionCount(0);

    if (command.action) {
      const result = command.action(args);
      console.log(`Executed slash command: /${command.name}`, result);
    }
  }, []);

  const close = useCallback(() => {
    setIsVisible(false);
    setQuery('');
    setSelectedIndex(0);
    setActiveCommand(undefined);
    setSuggestionCount(0);
  }, []);

  return {
    isVisible,
    query,
    selectedIndex,
    activeCommand,
    commands,
    handleInputChange,
    handleKeyDown,
    selectCommand,
    close,
    setSuggestionCount,
  };
}
