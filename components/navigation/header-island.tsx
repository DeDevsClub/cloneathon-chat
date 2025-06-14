'use client';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';

interface HeaderIslandProps {
  projectId: string;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  openSearchModal: () => void;
}

export function HeaderIsland({
  projectId,
  isSidebarOpen,
  toggleSidebar,
  openSearchModal,
}: HeaderIslandProps) {
  const router = useRouter();
  const { setTheme, theme } = useTheme();
  const handleProjectsClick = () => {
    router.push('/projects');
  };

  const createChat = (projectId: string) => {
    router.push(`/projects/${projectId}/chats/new`);
    router.refresh();
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
                className="size-8 hover:bg-muted"
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
                    className="size-8 hover:bg-muted"
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
                <TooltipContent side="bottom" sideOffset={5}>
                  Search (⌘K)
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      // Make sure projectId is a valid UUID and not the literal string "id"
                      if (projectId && projectId !== 'id') {
                        createChat(projectId);
                      } else {
                        console.error(
                          'Invalid projectId for chat creation:',
                          projectId,
                        );
                      }
                    }}
                    className="size-8 hover:bg-muted"
                    aria-label="Projects"
                  >
                    <Icon
                      icon="mdi:plus-circle-outline"
                      className="text-muted-foreground"
                      width={18}
                      height={18}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={5}>
                  New Chat
                </TooltipContent>
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
                onClick={() => handleProjectsClick()}
                className="size-8 text-foreground hover:bg-muted"
                aria-label="Projects"
              >
                <Icon
                  icon="solar:folder-bold-duotone"
                  className="text-muted-foreground"
                  width={18}
                  height={18}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={5}>
              Projects
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="size-8 hover:bg-muted"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <Icon
                    icon="icon-park-twotone:sun"
                    className="text-muted-foreground"
                    width={18}
                    height={18}
                  />
                ) : (
                  <Icon
                    icon="icon-park-twotone:moon"
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
