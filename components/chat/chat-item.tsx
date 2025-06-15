'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Chat } from '@/lib/db/schema';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import useSWRInfinite from 'swr/infinite';
import { ChatHistory } from '../navigation/sidebar-history';
import { getChatHistoryPaginationKey } from '../navigation/sidebar-history';
import { fetcher } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ChatItemProps {
  chat: Chat;
  active?: boolean;
  showMenu?: boolean;
  onChatSelected?: (chat: Chat) => void;
  className?: string;
}

export const ChatItem = ({
  chat,
  active = false,
  showMenu = true,
  onChatSelected,
  className,
}: ChatItemProps) => {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: paginatedChatHistories, mutate } = useSWRInfinite<ChatHistory>(
    getChatHistoryPaginationKey,
    fetcher,
    {
      fallbackData: [],
    },
  );

  const handleClick = () => {
    if (onChatSelected) {
      onChatSelected(chat);
    } else {
      router.push(`/chats/${chat.id}`);
    }
  };

  const handleDelete = async () => {
    const deletePromise = fetch(`/api/chats?id=${chat.id}`, {
      method: 'DELETE',
    });

    toast.promise(deletePromise, {
      loading: 'Deleting chat...',
      success: () => {
        mutate((chatHistories) => {
          if (chatHistories) {
            return chatHistories.map((chatHistory) => ({
              ...chatHistory,
              chats: chatHistory.chats.filter((chat) => chat.id),
            }));
          }
        });

        return 'Chat deleted successfully';
      },
      error: 'Failed to delete chat',
    });
    setShowDeleteDialog(false);
    router.refresh();
  };

  return (
    <div
      className={cn(
        'group flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted/50',
        active && 'bg-muted font-medium',
        className,
      )}
    >
      <Button
        variant="ghost"
        className="flex w-full items-center justify-start gap-2 px-2 hover:bg-transparent border-2 border-neutral-400/40 hover:border-neutral-400/80"
        onClick={handleClick}
      >
        <div className="flex size-5 items-center justify-center rounded-md ">
          <Icon icon="mdi:cat" className="size-3.5 text-white" />
        </div>
        <span className="truncate">{chat.title}</span>
      </Button>

      {showMenu && (
        <div className="flex items-center">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 opacity-50 transition-all group-hover:opacity-100 hover:scale-110"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(true);
                }}
              >
                <Icon icon="mdi:delete" className="size-12" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete
                  your account and remove your data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDelete()}>
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
};
