'use client';

import type { User } from 'next-auth';
import { useRouter } from 'next/navigation';

import { SidebarHistory } from '@/components/navigation/sidebar-history';
import { SidebarUserNav } from '@/components/navigation/sidebar-user-nav';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  useSidebar,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { HeaderIsland } from './header-island';
import { SearchModal } from '@/components/modals/search-modal';
import { useState } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PlusIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';

interface AppSidebarProps {
  user: User | undefined;
}

export function AppSidebar({ user }: AppSidebarProps) {
  const router = useRouter();
  const { toggleSidebar, state } = useSidebar();
  const isOpen = state === 'expanded';
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  const createChat = () => {
    // Validate projectId before navigation
    if (user?.id) {
      // console.log({ user });
      // console.log(`Creating chat for user ID: ${user.id}`);
      router.push(`/chats/new`);
      router.refresh();
    } else {
      console.error('Invalid user ID for chat creation:', user?.id);
      // Fallback to projects page if no valid projectId
      router.push('/projects');
    }
  };

  return (
    <>
      <SearchModal
        isOpen={isSearchModalOpen}
        onOpenChange={setIsSearchModalOpen}
      />
      <Sidebar className="group-data-[side=left]:border-r-0">
        <SidebarHeader className="flex flex-row gap-1 sm:ml-12 h-12 rounded-md justify-start items-center mt-2 max-w-full">
          <SidebarMenu>
            <HeaderIsland
              isSidebarOpen={isOpen}
              toggleSidebar={toggleSidebar}
              openSearchModal={() => setIsSearchModalOpen(true)}
            />
            <Link
              href="/"
              onClick={() => {
                router.push('/');
              }}
              className="flex flex-cols justify-center items-center gap-2 bg-muted rounded-md p-2 cursor-pointer"
            >
              <Icon icon="mdi:chat" className="size-6" />
              <span className="text-lg font-semibold hover:bg-muted rounded-md cursor-pointer flex flex-row max-w-full gap-2 items-center">
                th3.chat
              </span>
            </Link>
          </SidebarMenu>
        </SidebarHeader>
        <Tooltip>
          <Button
            variant="outline"
            type="button"
            className="w-full hover:bg-muted group grid place-items-center"
            onClick={() => {
              // Make sure projectId is a valid UUID and not the literal string "id"
              if (user?.id) {
                createChat();
              } else {
                // console.error('Invalid user ID for chat creation:');
                router.push('/login');
              }
            }}
          >
            <TooltipTrigger asChild>
              <PlusIcon />
            </TooltipTrigger>
            <TooltipContent align="end">New Chat</TooltipContent>
          </Button>
        </Tooltip>
        <SidebarContent>
          <SidebarHistory user={user} />
        </SidebarContent>
        <SidebarFooter>{user && <SidebarUserNav user={user} />}</SidebarFooter>
      </Sidebar>
    </>
  );
}
