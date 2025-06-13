'use client';

import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
// import { useChatStore } from "@/lib/store";
// import type { Conversation } from "@/lib/types"; // Import Conversation type
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';

interface HeaderIslandProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  openSearchModal: () => void;
}

export function HeaderIsland({
  isSidebarOpen,
  toggleSidebar,
  openSearchModal,
}: HeaderIslandProps) {
  const router = useRouter();
  // const { addConversation } = useChatStore();
  const { setTheme, theme } = useTheme();

  const handleSettingsClick = () => {
    router.push('/settings');
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-20 flex justify-between p-2">
        <div className="pointer-events-auto flex items-center gap-1 rounded-lg border border-border bg-card/95 p-1.5 shadow-lg backdrop-blur-md">
          {/* Left Island */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="h-8 w-8 hover:bg-muted"
                aria-label="Toggle sidebar"
              >
                <Icon
                  icon="flowbite:close-sidebar-solid"
                  className="text-muted-foreground"
                  width={18}
                  height={18}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={5}>
              Sidebar
            </TooltipContent>
          </Tooltip>

          {/* Conditionally rendered buttons with transition */}
          <div
            className={cn(
              'items-center gap-1 transition-all duration-300 ease-in-out',
              isSidebarOpen ? 'hidden' : 'flex',
            )}
          >
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={openSearchModal}
                    className="h-8 w-8 hover:bg-muted"
                    aria-label="Search"
                  >
                    <Icon
                      icon="icon-park-twotone:search"
                      className="text-muted-foreground"
                      width={18}
                      height={18}
                    />
                  </Button>
                </TooltipTrigger>
                {/* <TooltipContent side="bottom" sideOffset={5}>
                  Search (⌘K)
                </TooltipContent> */}
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  {/* <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const newChatId = `chat_${Date.now().toString()}`;
                      const newConversationEntry: Conversation = {
                        id: newChatId,
                        title: `New Chat ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
                        messages: [],
                        createdAt: new Date(),
                      };
                      addConversation(newConversationEntry);
                      router.push(`/chat/${newChatId}`);
                    }}
                    className="h-8 w-8 hover:bg-muted"
                    aria-label="New Chat"
                  >
                    <Icon
                      icon="ri:chat-new-fill"
                      className="text-muted-foreground"
                      width={18}
                      height={18}
                    />
                  </Button> */}
                </TooltipTrigger>
                {/* <TooltipContent side="bottom" sideOffset={5}>
                  New
                </TooltipContent> */}
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Right Island */}
        <div className="pointer-events-auto flex items-center gap-1 rounded-lg border border-border bg-card/95 p-1.5 shadow-lg backdrop-blur-md">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleSettingsClick()}
                className="h-8 w-8 hover:bg-muted"
                aria-label="Settings"
              >
                <Icon
                  icon="line-md:folder-settings-twotone"
                  className="text-muted-foreground"
                  width={18}
                  height={18}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={5}>
              Settings
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="h-8 w-8 hover:bg-muted"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <Icon
                    icon="line-md:sunny-outline-twotone"
                    className="text-muted-foreground"
                    width={18}
                    height={18}
                  />
                ) : (
                  <Icon
                    icon="line-md:moon-twotone-loop"
                    className="text-muted-foreground"
                    width={18}
                    height={18}
                  />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={5}>
              Theme
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
