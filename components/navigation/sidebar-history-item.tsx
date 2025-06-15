import type { Chat } from '@/lib/db/schema';
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  CheckCircleFillIcon,
  GlobeIcon,
  LockIcon,
  MoreHorizontalIcon,
  ShareIcon,
  TrashIcon,
} from '@/components/icons';
import { memo } from 'react';
import { useChatVisibility } from '@/hooks/use-chat-visibility';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';

const PureChatItem = ({
  chat,
  isActive,
  onDelete,
  setOpenMobile,
}: {
  chat: Chat;
  isActive: boolean;
  onDelete: (chatId: string) => void;
  setOpenMobile: (open: boolean) => void;
}) => {
  const { visibilityType, setVisibilityType } = useChatVisibility({
    chatId: chat.id,
    initialVisibilityType: chat.visibility,
  });

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive}>
        <Link href={`/chats/${chat.id}`} onClick={() => setOpenMobile(false)}>
          <span>{chat.title}</span>
        </Link>
      </SidebarMenuButton>

      <Button
        variant="outline"
        size="icon"
        className="absolute top-0 right-0 z-10 size-8 m-2 bg-transparent hover:bg-red-500"
        onClick={() => onDelete(chat.id)}
      >
        <TrashIcon />
      </Button>

      <Button
        variant="outline"
        size="icon"
        className={`absolute top-0 right-8 z-10 size-8 m-2 bg-transparent ${
          visibilityType === 'private'
            ? 'hover:bg-red-500'
            : 'hover:bg-gray-500'
        }`}
        onClick={() => {
          setVisibilityType(
            visibilityType === 'private' ? 'public' : 'private',
          );
        }}
      >
        {visibilityType === 'private' ? (
          <LockIcon size={12} />
        ) : (
          <GlobeIcon size={12} />
        )}
      </Button>
    </SidebarMenuItem>
  );
};

export const ChatItem = memo(PureChatItem, (prevProps, nextProps) => {
  if (prevProps.isActive !== nextProps.isActive) return false;
  return true;
});
