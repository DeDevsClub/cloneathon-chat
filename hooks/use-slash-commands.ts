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
}

export function useSlashCommands({
  onClearChat,
  onToggleWebSearch,
  onSwitchModel,
}: UseSlashCommandsProps) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeCommand, setActiveCommand] = useState<SlashCommand | undefined>();
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
      toast.info('Available commands: /new, /clear, /search, /model, /projects, /project, /help');
    },
  });

  const handleInputChange = (input: string): { shouldClear: boolean } => {
    const parsed = parseSlashCommand(input, config.trigger);
    
    if (parsed.isCommand) {
      setQuery(parsed.command || '');
      setIsVisible(true);
      setSelectedIndex(0);
      
      // Check if this is a complete command match for suggestions
      const exactCommand = commands.find(cmd => 
        cmd.name === parsed.command || cmd.aliases?.includes(parsed.command || '')
      );
      
      if (exactCommand && exactCommand.suggestions && !parsed.args) {
        // Show suggestions for this command
        setActiveCommand(exactCommand);
      } else {
        setActiveCommand(undefined);
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
          // Handle suggestions navigation - we'll need to track suggestions count
          setSelectedIndex(prev => prev + 1);
        } else {
          setSelectedIndex(prev => (prev + 1) % Math.min(filteredCommands.length, config.maxSuggestions));
        }
        return true;

      case 'ArrowUp':
        event.preventDefault();
        if (activeCommand?.suggestions) {
          setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
        } else {
          setSelectedIndex(prev => 
            prev === 0 ? Math.min(filteredCommands.length, config.maxSuggestions) - 1 : prev - 1
          );
        }
        return true;

      case 'Enter':
        event.preventDefault();
        if (activeCommand?.suggestions) {
          // Will be handled by the menu component
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
    command.action(args);
    close();
  }, []);

  const close = useCallback(() => {
    setIsVisible(false);
    setQuery('');
    setSelectedIndex(0);
    setActiveCommand(undefined);
  }, []);

  return {
    commands,
    query,
    isVisible,
    selectedIndex,
    activeCommand,
    config,
    handleInputChange,
    handleKeyDown,
    selectCommand,
    close,
  };
}
