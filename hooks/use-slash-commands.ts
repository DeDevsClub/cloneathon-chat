'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
  config?: Partial<SlashCommandConfig>;
}

export function useSlashCommands({
  onClearChat,
  onToggleWebSearch,
  onSwitchModel,
  config = {},
}: UseSlashCommandsProps = {}) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [query, setQuery] = useState('');

  const mergedConfig = { ...defaultConfig, ...config };

  // Command handlers
  const handlers = useMemo(
    () => ({
      onNewChat: () => {
        router.push('/chats/new');
        toast.success('Creating new chat...');
      },
      onClearChat: () => {
        if (onClearChat) {
          onClearChat();
          toast.success('Chat cleared');
        } else {
          toast.error('Clear chat not available');
        }
      },
      onToggleWebSearch: () => {
        if (onToggleWebSearch) {
          onToggleWebSearch();
          toast.success('Web search toggled');
        } else {
          toast.error('Web search not available');
        }
      },
      onSwitchModel: (modelId?: string) => {
        if (onSwitchModel) {
          onSwitchModel(modelId);
          toast.success(`Switched to ${modelId || 'default'} model`);
        } else {
          toast.error('Model switching not available');
        }
      },
      onNavigateToProjects: () => {
        router.push('/projects');
        toast.success('Navigating to projects...');
      },
      onCreateProject: () => {
        router.push('/projects/new');
        toast.success('Creating new project...');
      },
      onHelp: () => {
        toast.info(
          'Available commands: /new, /clear, /search, /model, /projects, /project, /help',
        );
      },
    }),
    [router, onClearChat, onToggleWebSearch, onSwitchModel],
  );

  const commands = useMemo(() => createSlashCommands(handlers), [handlers]);

  const filteredCommands = useMemo(() => {
    return filterCommands(commands, query).slice(
      0,
      mergedConfig.maxSuggestions,
    );
  }, [commands, query, mergedConfig.maxSuggestions]);

  // Reset selection when filtered commands change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredCommands]);

  const handleInputChange = useCallback(
    (value: string) => {
      const parsed = parseSlashCommand(value, mergedConfig.trigger);

      if (parsed.isCommand && parsed.partial && parsed.command !== undefined) {
        setQuery(parsed.command);
        setIsVisible(true);
      } else if (parsed.isCommand && !parsed.partial) {
        // Command is complete, execute it
        const command = commands.find(
          (cmd) =>
            cmd.name === parsed.command ||
            cmd.aliases?.includes(parsed.command || ''),
        );

        if (command) {
          command.action(parsed.args);
          return { shouldClear: true, shouldSubmit: false };
        } else {
          toast.error(`Unknown command: /${parsed.command}`);
          return { shouldClear: true, shouldSubmit: false };
        }
      } else {
        setIsVisible(false);
        setQuery('');
      }

      return { shouldClear: false, shouldSubmit: false };
    },
    [commands, mergedConfig.trigger],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isVisible || filteredCommands.length === 0) return false;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev <= 0 ? filteredCommands.length - 1 : prev - 1,
          );
          return true;

        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev >= filteredCommands.length - 1 ? 0 : prev + 1,
          );
          return true;

        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < filteredCommands.length) {
            const selectedCommand = filteredCommands[selectedIndex];
            selectedCommand.action();
            setIsVisible(false);
            setQuery('');
            return true;
          }
          break;

        case 'Escape':
          e.preventDefault();
          setIsVisible(false);
          setQuery('');
          return true;

        case 'Tab':
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < filteredCommands.length) {
            const firstCommand = filteredCommands[selectedIndex];
            if (firstCommand) {
              return {
                shouldReplace: true,
                replacement: `/${firstCommand.name} `,
              };
            }
          }
          break;
      }

      return false;
    },
    [isVisible, filteredCommands, selectedIndex],
  );

  const selectCommand = useCallback((command: SlashCommand, args?: string) => {
    command.action(args);
    setIsVisible(false);
    setQuery('');
  }, []);

  const close = useCallback(() => {
    setIsVisible(false);
    setQuery('');
  }, []);

  return {
    // State
    isVisible,
    selectedIndex,
    query,
    commands,
    filteredCommands,
    config: mergedConfig,

    // Actions
    handleInputChange,
    handleKeyDown,
    selectCommand,
    close,
  };
}
