import { Dispatch, SetStateAction } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Chat } from '@/lib/db/schema';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
interface ChatMenuProps {
  chat: Chat;
  open: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
}

export const ChatMenu = ({ chat, open, onOpenChange }: ChatMenuProps) => {
  const router = useRouter();

  const handleDelete = async () => {
    console.log(chat.id);
    try {
      const response = await fetch(`/api/chats/${chat.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete chat');
      }

      toast.success('Chat deleted successfully');
      router.refresh(); // Refresh to update the chats list
    } catch (error) {
      toast.error('Failed to delete chat');
      console.error('Error deleting chat:', error);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <span className="sr-only">Open chat menu</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
          onClick={handleDelete}
        >
          <Trash2 className="mr-2 size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
