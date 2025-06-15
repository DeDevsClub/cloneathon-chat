'use client';

import { Icon } from '@iconify/react';
import Image from 'next/image';
import type { User } from 'next-auth';
import { signOut } from 'next-auth/react';

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { useRouter } from 'next/navigation';

export function SidebarUserNav({ user }: { user: User }) {
  const router = useRouter();
  const isGuest = user.type === 'guest';

  return (
    <SidebarMenu>
      {!isGuest ? (
        <SidebarMenuItem>
          <SidebarMenuButton
            data-testid="user-nav-button"
            className="justify-center gap-4 h-12 bg-background hover:bg-sidebar-accent"
            onClick={() => signOut()}
          >
            <Image
              src={`https://avatar.vercel.sh/${user.email}`}
              alt={user.email ?? 'User Avatar'}
              width={24}
              height={24}
              className="rounded-full"
            />
            <span data-testid="user-email" className="truncate">
              {user.email}
            </span>
            <Icon
              icon="mdi:logout"
              width={24}
              height={24}
              className="text-muted-foreground hover:text-sidebar-accent-foreground"
            />
          </SidebarMenuButton>
        </SidebarMenuItem>
      ) : (
        <SidebarMenuItem>
          <SidebarMenuButton
            type="button"
            className="justify-center gap-4 data-[state=open]:bg-sidebar-accent bg-background data-[state=open]:text-sidebar-accent-foreground h-10"
            onClick={() => router.push('/signup')}
          >
            {'Create Account'}
          </SidebarMenuButton>
        </SidebarMenuItem>
      )}
    </SidebarMenu>
  );
}
