'use client';

import type { User } from 'next-auth';
import { useRouter } from 'next/navigation';

import { PlusIcon } from '@/components/icons';
import { SidebarHistory } from '@/components/navigation/sidebar-history';
import { SidebarUserNav } from '@/components/navigation/sidebar-user-nav';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  useSidebar,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Icon } from '@iconify/react';
import { HeaderIsland } from './header-island';
import { SearchModal } from '@/components/modals/search-modal';
import { useState } from 'react';

interface AppSidebarProps {
  user: User | undefined;
}
export function AppSidebar({ user }: AppSidebarProps) {
  const router = useRouter();
  const { toggleSidebar, state } = useSidebar();
  const isOpen = state === 'expanded';
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  const createChat = () => {
    router.push('/');
    router.refresh();
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
        {/* <Tooltip> */}
        {/* <Button
            variant="outline"
            type="button"
            className="w-full hover:bg-muted group grid place-items-center"
            onClick={() => {
              createChat();
            }}
          >
            <TooltipTrigger asChild>
              <PlusIcon />
            </TooltipTrigger>
            <TooltipContent align="end">New Chat</TooltipContent>
          </Button> */}
        {/* </Tooltip> */}
        <SidebarContent>
          <SidebarHistory user={user} />
        </SidebarContent>
        <SidebarFooter>{user && <SidebarUserNav user={user} />}</SidebarFooter>
      </Sidebar>
    </>
  );
}
