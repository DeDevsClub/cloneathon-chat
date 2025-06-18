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
  activeCommand?: SlashCommand; // For showing suggestions
  onSuggestionCountChange?: (count: number) => void;
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
  config,
  className,
  activeCommand,
  onSuggestionCountChange,
}: SlashCommandMenuProps) {
  const [suggestions, setSuggestions] = useState<
    { id: string; name: string; description?: string }[]
  >([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Load suggestions when activeCommand has suggestions function
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    if (isVisible) {
      document.addEventListener('keydown', handleEscape);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isVisible, onClose]);

  useEffect(() => {
    const loadSuggestions = async () => {
      if (activeCommand?.suggestions) {
        setLoadingSuggestions(true);
        try {
          const projectSuggestions = await activeCommand.suggestions();
          setSuggestions(projectSuggestions);
          onSuggestionCountChange?.(projectSuggestions.length);
        } catch (error) {
          console.error('Error loading suggestions:', error);
          setSuggestions([]);
          onSuggestionCountChange?.(0);
        } finally {
          setLoadingSuggestions(false);
        }
      } else {
        setSuggestions([]);
        onSuggestionCountChange?.(0);
      }
    };
    
    loadSuggestions();
  }, [activeCommand, onSuggestionCountChange]);

  if (!isVisible) return null;

  // If we have an active command with suggestions, show those
  if (activeCommand?.suggestions) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'absolute bottom-full left-0 mb-2 w-full max-w-md z-50',
            className,
          )}
        >
          <div className="bg-background border border-border rounded-lg shadow-lg overflow-hidden">
            <Command className="max-h-96">
              <CommandList>
                {loadingSuggestions ? (
                  <CommandItem disabled>
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full size-4 border-b-2 border-primary" />
                      <span>Loading projects...</span>
                    </div>
                  </CommandItem>
                ) : suggestions.length > 0 ? (
                  <CommandGroup heading={`Projects (${suggestions.length})`}>
                    {suggestions.map((suggestion, index) => (
                      <CommandItem
                        key={suggestion.id}
                        onSelect={() =>
                          onSelectCommand(activeCommand, suggestion.id)
                        }
                        className={cn(
                          'flex items-center gap-3 p-3 cursor-pointer',
                          selectedIndex === index &&
                            'bg-accent text-accent-foreground',
                        )}
                      >
                        <span className="text-lg">📂</span>
                        <div className="flex-1">
                          <div className="font-medium">{suggestion.name}</div>
                          {suggestion.description && (
                            <div className="text-sm text-muted-foreground">
                              {suggestion.description}
                            </div>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ) : (
                  <CommandEmpty>No projects found</CommandEmpty>
                )}
              </CommandList>
            </Command>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Default command list view
  const filteredCommands = filterCommands(commands, query);
  const groupedCommands = config?.showCategories
    ? groupCommandsByCategory(filteredCommands)
    : { all: filteredCommands };

  const maxSuggestions = config?.maxSuggestions || 8;
  const commandsToShow = Object.values(groupedCommands)
    .flat()
    .slice(0, maxSuggestions);

  let currentIndex = 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'absolute bottom-full left-0 mb-2 w-full max-w-full z-50',
          className,
        )}
      >
        <div className="bg-background border border-border rounded-lg shadow-lg overflow-hidden">
          <Command className="max-h-96">
            <CommandList>
              {commandsToShow.length === 0 ? (
                <CommandEmpty>{`No commands found for "${query}"`}</CommandEmpty>
              ) : config?.showCategories ? (
                Object.entries(groupedCommands).map(
                  ([category, categoryCommands]) => {
                    if (categoryCommands.length === 0) return null;

                    const categoryLabel =
                      categoryLabels[category as keyof typeof categoryLabels] ||
                      category;
                    const startIndex = currentIndex;
                    const endIndex = currentIndex + categoryCommands.length;
                    currentIndex = endIndex;

                    return (
                      <CommandGroup key={category} heading={categoryLabel}>
                        {categoryCommands
                          .slice(0, maxSuggestions)
                          .map((command, index) => {
                            const globalIndex = startIndex + index;
                            return (
                              <CommandItem
                                key={command.name}
                                onSelect={() => onSelectCommand(command)}
                                className={cn(
                                  'flex items-center gap-3 p-3 cursor-pointer',
                                  selectedIndex === globalIndex &&
                                    'bg-accent text-accent-foreground',
                                )}
                              >
                                <span className="text-lg">
                                  {command.icon || '⚡'}
                                </span>
                                <div className="flex-1">
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
                                                variant="secondary"
                                                className="text-xs px-1 py-0"
                                              >
                                                /{alias}
                                              </Badge>
                                            ))}
                                        </div>
                                      )}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {command.description}
                                  </div>
                                </div>
                                <Badge
                                  className={cn(
                                    'text-xs',
                                    categoryColors[
                                      command.category as keyof typeof categoryColors
                                    ],
                                  )}
                                >
                                  {categoryLabels[
                                    command.category as keyof typeof categoryLabels
                                  ] || command.category}
                                </Badge>
                              </CommandItem>
                            );
                          })}
                      </CommandGroup>
                    );
                  },
                )
              ) : (
                <CommandGroup>
                  {commandsToShow.map((command, index) => (
                    <CommandItem
                      key={command.name}
                      onSelect={() => onSelectCommand(command)}
                      className={cn(
                        'flex items-center gap-3 p-3 cursor-pointer',
                        selectedIndex === index &&
                          'bg-accent text-accent-foreground',
                      )}
                    >
                      <span className="text-lg">{command.icon || '⚡'}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">/{command.name}</span>
                          {command.aliases && command.aliases.length > 0 && (
                            <div className="flex gap-1">
                              {command.aliases.slice(0, 2).map((alias) => (
                                <Badge
                                  key={alias}
                                  variant="secondary"
                                  className="text-xs px-1 py-0"
                                >
                                  /{alias}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {command.description}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
