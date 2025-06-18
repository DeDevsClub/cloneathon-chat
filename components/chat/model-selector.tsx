'use client';

import { startTransition, useMemo, useOptimistic, useState } from 'react';

import { saveChatModelAsCookie } from '@/app/chats/actions';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { chatModels } from '@/lib/ai/models';
import { cn } from '@/lib/utils';

import { CheckCircleFillIcon, ChevronDownIcon } from '../icons';
import { entitlementsByUserType } from '@/lib/ai/entitlements';
import type { Session } from 'next-auth';
// import { useLocalStorage } from 'usehooks-ts';

export function ModelSelector({
  session,
  selectedModelId,
  className,
  onModelChange,
}: {
  session: Session;
  selectedModelId: string;
  onModelChange?: (modelId: string) => void;
} & React.ComponentProps<typeof Button>) {
  const [open, setOpen] = useState(false);
  const [optimisticModelId, setOptimisticModelId] =
    useOptimistic(selectedModelId);

  // Default to 'guest' if session or user type is undefined
  const userType = session?.user?.type || 'guest';
  // console.log({ userType });
  const { availableChatModelIds } = entitlementsByUserType[userType];
  const availableChatModels = chatModels.filter((chatModel) =>
    availableChatModelIds.includes(chatModel.id),
  );
  // console.log({ availableChatModels });

  const selectedChatModel = useMemo(
    () =>
      availableChatModels.find(
        (chatModel) => chatModel.id === optimisticModelId,
      ),
    [optimisticModelId, availableChatModels],
  );

  // console.log({ selectedChatModel });

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        asChild
        className={cn(
          'w-fit data-[state=open]:bg-accent data-[state=open]:text-accent-foreground',
          className,
        )}
      >
        <Button
          data-testid="model-selector"
          variant="outline"
          className="md:px-2 md:h-[34px]"
        >
          {selectedChatModel?.name}
          <ChevronDownIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[300px]">
        {availableChatModels.map((chatModel) => {
          const { id } = chatModel;

          return (
            <DropdownMenuItem
              data-testid={`model-selector-item-${id}`}
              key={id}
              onSelect={() => {
                setOpen(false);

                startTransition(() => {
                  setOptimisticModelId(id);
                  saveChatModelAsCookie(id);
                  onModelChange?.(id);
                });
              }}
              data-active={id === optimisticModelId}
              asChild
            >
              <button
                type="button"
                className="gap-4 group/item flex flex-row justify-between items-center w-full"
              >
                <div className="flex flex-col gap-1 items-start">
                  <div className="flex items-center gap-2">
                    <span>{chatModel.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      chatModel.provider === 'openai' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                      chatModel.provider === 'anthropic' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' :
                      chatModel.provider === 'xai' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                      chatModel.provider === 'groq' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' :
                      'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
                    }`}>
                      {chatModel.provider === 'openai' ? 'OpenAI' :
                       chatModel.provider === 'anthropic' ? 'Anthropic' :
                       chatModel.provider === 'xai' ? 'xAI' :
                       chatModel.provider === 'groq' ? 'Groq' :
                       chatModel.provider}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {chatModel.description}
                  </div>
                  {chatModel.capabilities && chatModel.capabilities.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {chatModel.capabilities.map((capability) => (
                        <span
                          key={capability}
                          className="text-xs px-1.5 py-0.5 bg-accent text-accent-foreground rounded"
                        >
                          {capability}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="text-foreground dark:text-foreground opacity-0 group-data-[active=true]/item:opacity-100">
                  <CheckCircleFillIcon />
                </div>
              </button>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
