'use client';

import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ArrowLeft, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useIsMobile } from '@/hooks/use-mobile';

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

  if (!isMobile) {
    return null;
  }

  const handleBack = () => {
    router.back();
  };

  const handleNewChat = () => {
    router.push('/chats/new');
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 ">
      {/*  bg-transparent/10 backdrop-blur-xs border-b border-border */}
      <div className="flex items-center justify-between p-2 ">
        {/* Left section */}
        <div className="flex items-center gap-1 bg-transparent/10 w-fit backdrop-blur-xs border-b border-border rounded-lg p-1">
          <SidebarTrigger className="size-7 hover:scale-110 transition-all bg-violet-800/80 hover:bg-violet-600/80 text-muted hover:text-white" />
          {showBackButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="size-7 hover:scale-110 transition-all bg-violet-800/80 hover:bg-violet-600/80 text-muted hover:text-white"
              aria-label="Back"
            >
              <ArrowLeft className="size-7" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNewChat}
            className="size-7 hover:scale-110 transition-all bg-violet-800/80 hover:bg-violet-600/80 text-muted hover:text-white"
            aria-label="New Chat"
          >
            <Plus className="size-7" />
          </Button>
        </div>
      </div>
    </div>
  );
}
