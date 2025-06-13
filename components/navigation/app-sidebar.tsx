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
  const { toggleSidebar, state, setOpenMobile } = useSidebar();
  const isOpen = state === 'expanded';
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  return (
    <>
      <SearchModal
        isOpen={isSearchModalOpen}
        onOpenChange={setIsSearchModalOpen}
      />
      <Sidebar className="group-data-[side=left]:border-r-0">
        <SidebarHeader>
          <HeaderIsland
            isSidebarOpen={isOpen}
            toggleSidebar={toggleSidebar}
            openSearchModal={() => setIsSearchModalOpen(true)}
          />
          <SidebarMenu>
            <div className="flex flex-row justify-between items-center">
              <Link
                href="/"
                onClick={() => {
                  router.push('/');
                }}
                className="flex flex-row gap-3 items-center w-full"
              >
                <span className="text-lg font-semibold px-2 hover:bg-muted rounded-md cursor-pointer flex flex-row gap-2 items-center">
                  <Icon icon="mdi:chat" className="size-6" />
                  th3.chat
                </span>
              </Link>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    type="button"
                    className="p-2 h-fit"
                    onClick={() => {
                      router.push('/');
                      router.refresh();
                    }}
                  >
                    <PlusIcon />
                  </Button>
                </TooltipTrigger>
                <TooltipContent align="end">New Chat</TooltipContent>
              </Tooltip>
            </div>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarHistory user={user} />
        </SidebarContent>
        <SidebarFooter>{user && <SidebarUserNav user={user} />}</SidebarFooter>
      </Sidebar>
    </>
  );
}
