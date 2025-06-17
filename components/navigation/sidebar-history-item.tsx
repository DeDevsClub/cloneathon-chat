import type { Chat } from '@/lib/db/schema';
import { SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import Link from 'next/link';
import { GlobeIcon, LockIcon, TrashIcon } from '@/components/icons';
import { memo, useState, useRef, useEffect } from 'react';
import { useChatVisibility } from '@/hooks/use-chat-visibility';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { updateChatTitle } from '@/app/chats/actions';
import { toast } from 'sonner';
import { Edit3Icon, CheckIcon, XIcon } from 'lucide-react';

const PureChatItem = ({
  chat,
  isActive,
  onDelete,
  onRename,
  setOpenMobile,
}: {
  chat: Chat;
  isActive: boolean;
  onDelete: (chatId: string) => void;
  onRename?: (chatId: string, newTitle: string) => void;
  setOpenMobile: (open: boolean) => void;
}) => {
  const { visibilityType, setVisibilityType } = useChatVisibility({
    chatId: chat.id,
    initialVisibilityType: chat.visibility,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(chat.title);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSaveTitle = async () => {
    if (editTitle.trim() === chat.title.trim()) {
      setIsEditing(false);
      return;
    }

    if (editTitle.trim() === '') {
      toast.error('Chat title cannot be empty');
      setEditTitle(chat.title);
      return;
    }

    setIsLoading(true);
    try {
      await updateChatTitle({
        chatId: chat.id,
        title: editTitle.trim(),
      });
      toast.success('Chat title updated');
      setIsEditing(false);
      // Notify parent component to update the chat list
      onRename?.(chat.id, editTitle.trim());
    } catch (error) {
      console.error('Error updating chat title:', error);
      toast.error('Failed to update chat title');
      setEditTitle(chat.title);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditTitle(chat.title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive} className="group">
        {isEditing ? (
          <div className="flex items-center gap-2 px-2 py-1.5">
            <Input
              ref={inputRef}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className="h-6 text-sm"
              placeholder="Enter chat title..."
            />
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="size-6 p-0"
                onClick={handleSaveTitle}
                disabled={isLoading}
              >
                <CheckIcon size={12} />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="size-6 p-0"
                onClick={handleCancelEdit}
                disabled={isLoading}
              >
                <XIcon size={12} />
              </Button>
            </div>
          </div>
        ) : (
          <Link href={`/chats/${chat.id}`} onClick={() => setOpenMobile(false)}>
            <span className="truncate">
              {chat.title.length > 20
                ? `${chat.title.slice(0, 16)}...`
                : chat.title}
            </span>
          </Link>
        )}
      </SidebarMenuButton>

      {!isEditing && (
        <>
          {/* Sidebar - Rename chat */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-0 right-20 z-10 size-6 m-2 p-0 opacity-0 group-hover:opacity-100 bg-transparent hover:bg-blue-500/20"
            onClick={() => setIsEditing(true)}
            title="Rename chat"
          >
            <Edit3Icon size={12} />
          </Button>

          {/* Sidebar - Change visibility */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-0 right-10 z-10 size-6 m-2 p-0 opacity-0 group-hover:opacity-100 bg-transparent hover:bg-gray-500/20"
            onClick={() => {
              setVisibilityType(
                visibilityType === 'private' ? 'public' : 'private',
              );
            }}
            title="Change visibility"
          >
            {visibilityType === 'private' ? (
              <LockIcon size={12} />
            ) : (
              <GlobeIcon size={12} />
            )}
          </Button>

          {/* Sidebar - Delete chat */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-0 right-0 z-10 size-6 m-2 p-0 opacity-0 group-hover:opacity-100 bg-transparent hover:bg-red-500/20"
            onClick={() => onDelete(chat.id)}
            title="Delete chat"
          >
            <TrashIcon />
          </Button>
        </>
      )}
    </SidebarMenuItem>
  );
};

export const ChatItem = memo(PureChatItem, (prevProps, nextProps) => {
  if (prevProps.isActive !== nextProps.isActive) return false;
  if (prevProps.chat.title !== nextProps.chat.title) return false;
  return true;
});
