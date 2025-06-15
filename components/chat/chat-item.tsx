import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Chat } from '@/lib/db/schema';
import { Cat as CatIcon, MoreHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ChatMenu } from '@/components/chat/chat-menu';

interface ChatItemProps {
  chat: Chat;
  active?: boolean;
  showMenu?: boolean;
  onChatSelected?: (chat: Chat) => void;
}

export const ChatItem = ({
  chat,
  active = false,
  showMenu = true,
  onChatSelected,
}: ChatItemProps) => {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleClick = () => {
    if (onChatSelected) {
      onChatSelected(chat);
    } else {
      router.push(`/chats/${chat.id}`);
    }
  };

  return (
    <div
      className={cn(
        'group flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted/50',
        active && 'bg-muted font-medium',
      )}
    >
      <Button
        variant="ghost"
        className="flex w-full items-center justify-start gap-2 px-2 hover:bg-transparent"
        onClick={handleClick}
      >
        <div className="flex size-5 items-center justify-center rounded-md">
          <CatIcon className="size-3.5 text-white" />
        </div>
        <span className="truncate">{chat.title}</span>
      </Button>

      {showMenu && (
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="size-7 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(true);
            }}
          >
            <MoreHorizontal className="size-4" />
          </Button>
          <ChatMenu chat={chat} open={menuOpen} onOpenChange={setMenuOpen} />
        </div>
      )}
    </div>
  );
};
