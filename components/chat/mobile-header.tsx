'use client';

import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ArrowLeft, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Icon } from '@iconify/react';
import { useTheme } from 'next-themes';

interface MobileHeaderProps {
  chatId?: string;
  showBackButton?: boolean;
}

export function MobileHeader({
  chatId,
  showBackButton = true,
}: MobileHeaderProps) {
  const isMobile = useIsMobile();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  if (!isMobile) {
    return null;
  }

  const handleBack = () => {
    router.back();
  };

  const handleNewChat = () => {
    router.push('/chats/new');
  };

  const handleProjectsClick = () => {
    router.push('/projects');
  };

  return (
    <div className="fixed top-0 inset-x-0 z-50 ">
      {/*  bg-transparent/10 backdrop-blur-xs border-b border-border */}
      <div className="flex items-center justify-between p-2">
        {/* Left section */}
        <div className="flex items-center gap-1 bg-transparent/10 w-fit backdrop-blur-xs border-b border-border rounded-lg p-1">
          <SidebarTrigger className="size-7 hover:scale-110 transition-all" />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNewChat}
            className="size-7 hover:scale-110 transition-all"
            aria-label="New Chat"
          >
            <Icon icon="ri:chat-new-fill" width={18} height={18} />
          </Button>
        </div>
        <div className="flex items-center gap-1 bg-transparent/10 w-fit backdrop-blur-xs border-b border-border rounded-lg p-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleProjectsClick()}
            className="size-7 hover:scale-110 transition-all"
            aria-label="Projects"
          >
            <Icon icon="tabler:folder-filled" width={18} height={18} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="size-7 hover:scale-110 transition-all"
            aria-label="Projects"
          >
            {theme === 'dark' ? (
              <Icon icon="tabler:sun-filled" width={18} height={18} />
            ) : (
              <Icon icon="tabler:moon-filled" width={18} height={18} />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
