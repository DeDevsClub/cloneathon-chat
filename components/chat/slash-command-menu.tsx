'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  SlashCommand,
  SlashCommandConfig,
  filterCommands,
  groupCommandsByCategory,
} from '@/lib/slash-commands';

interface SlashCommandMenuProps {
  commands: SlashCommand[];
  query: string;
  isVisible: boolean;
  selectedIndex: number;
  onSelectCommand: (command: SlashCommand, args?: string) => void;
  onClose: () => void;
  config?: Partial<SlashCommandConfig>;
  className?: string;
}

const categoryLabels = {
  chat: 'Chat',
  navigation: 'Navigation',
  tools: 'Tools',
  ai: 'AI Models',
};

const categoryColors = {
  chat: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  navigation:
    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  tools:
    'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  ai: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
};

export function SlashCommandMenu({
  commands,
  query,
  isVisible,
  selectedIndex,
  onSelectCommand,
  onClose,
  config = {},
  className,
}: SlashCommandMenuProps) {
  const [filteredCommands, setFilteredCommands] = useState<SlashCommand[]>([]);
  const [groupedCommands, setGroupedCommands] = useState<
    Record<string, SlashCommand[]>
  >({});

  const maxSuggestions = config.maxSuggestions ?? 8;
  const showCategories = config.showCategories ?? true;

  useEffect(() => {
    const filtered = filterCommands(commands, query).slice(0, maxSuggestions);
    setFilteredCommands(filtered);

    if (showCategories) {
      setGroupedCommands(groupCommandsByCategory(filtered));
    }
  }, [commands, query, maxSuggestions, showCategories]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isVisible, onClose]);

  const handleSelectCommand = (command: SlashCommand, args?: string) => {
    onSelectCommand(command, args);
    onClose();
  };

  if (!isVisible || filteredCommands.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.15 }}
        className={cn(
          'absolute bottom-full left-0 right-0 mb-2 z-50',
          'bg-background border border-border rounded-lg shadow-lg',
          'max-h-80 overflow-hidden',
          className,
        )}
      >
        <Command className="w-full">
          <CommandList>
            {filteredCommands.length === 0 ? (
              <CommandEmpty>No commands found.</CommandEmpty>
            ) : showCategories ? (
              Object.entries(groupedCommands).map(
                ([category, categoryCommands]) => (
                  <CommandGroup
                    key={category}
                    heading={
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          {categoryLabels[
                            category as keyof typeof categoryLabels
                          ] || category}
                        </span>
                        <Badge
                          variant="secondary"
                          className={cn(
                            'text-xs px-1.5 py-0.5',
                            categoryColors[
                              category as keyof typeof categoryColors
                            ],
                          )}
                        >
                          {categoryCommands.length}
                        </Badge>
                      </div>
                    }
                  >
                    {categoryCommands.map((command, index) => {
                      const globalIndex = filteredCommands.indexOf(command);
                      return (
                        <CommandItem
                          key={`${category}-${command.name}`}
                          value={command.name}
                          onSelect={() => handleSelectCommand(command)}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2 cursor-pointer',
                            'hover:bg-accent hover:text-accent-foreground',
                            globalIndex === selectedIndex &&
                              'bg-accent text-accent-foreground',
                          )}
                        >
                          {command.icon && (
                            <span className="text-lg shrink-0">
                              {command.icon}
                            </span>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                /{command.name}
                              </span>
                              {command.aliases &&
                                command.aliases.length > 0 && (
                                  <div className="flex gap-1">
                                    {command.aliases
                                      .slice(0, 2)
                                      .map((alias) => (
                                        <Badge
                                          key={alias}
                                          variant="outline"
                                          className="text-xs px-1.5 py-0"
                                        >
                                          /{alias}
                                        </Badge>
                                      ))}
                                  </div>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {command.description}
                            </p>
                          </div>
                          <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium text-muted-foreground opacity-100">
                            <span className="text-xs">↵</span>
                          </kbd>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                ),
              )
            ) : (
              filteredCommands.map((command, index) => (
                <CommandItem
                  key={command.name}
                  value={command.name}
                  onSelect={() => handleSelectCommand(command)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 cursor-pointer',
                    'hover:bg-accent hover:text-accent-foreground',
                    index === selectedIndex &&
                      'bg-accent text-accent-foreground',
                  )}
                >
                  {command.icon && (
                    <span className="text-lg shrink-0">{command.icon}</span>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">/{command.name}</span>
                      {command.aliases && command.aliases.length > 0 && (
                        <div className="flex gap-1">
                          {command.aliases.slice(0, 2).map((alias) => (
                            <Badge
                              key={alias}
                              variant="outline"
                              className="text-xs px-1.5 py-0"
                            >
                              /{alias}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {command.description}
                    </p>
                  </div>
                  <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium text-muted-foreground opacity-100">
                    <span className="text-xs">↵</span>
                  </kbd>
                </CommandItem>
              ))
            )}
          </CommandList>
        </Command>
      </motion.div>
    </AnimatePresence>
  );
}
