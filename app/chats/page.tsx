'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { ChatItem } from '@/components/chat/chat-item';
import { CreateChatDialog } from '@/components/chat/create-chat-dialogue';

const ChatsPage = () => {
  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState<any[]>([]);
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const fetchChats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/chats/history');
      if (!response.ok) {
        // console.log('Project fetch status:', response.status);
        throw new Error(`Failed to fetch chats: ${response.status}`);
      }

      const data = await response.json();
      setChats(data.chats || []);
    } catch (error) {
      console.error('Error fetching chats:', error);
      toast.error('Failed to load chats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  const handleChatCreated = (chat: any) => {
    // Refresh the project list after a new project is created
    fetchChats();
    setOpen(false);
    toast.success('Chat created successfully');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isSidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        // Check if the click originated from within the HeaderIsland to prevent immediate closure
        const headerIslandElement = document.querySelector(
          '.pointer-events-none.fixed.inset-x-0.top-0',
        );
        if (headerIslandElement?.contains(event.target as Node)) {
          // Check if the actual click target is the toggle button itself or its child icon
          // This is a bit of a heuristic. A more robust way would be to pass a ref for the toggle button.
          let targetElement = event.target as HTMLElement;
          let isToggleButton = false;
          while (targetElement && targetElement !== headerIslandElement) {
            if (targetElement.getAttribute('aria-label') === 'Toggle sidebar') {
              isToggleButton = true;
              break;
            }
            targetElement = targetElement.parentElement as HTMLElement;
          }
          if (isToggleButton) return; // Don't close if toggle button was clicked
        }
        setIsSidebarOpen(false);
      }
    };

    if (isSidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSidebarOpen]);

  return (
    <div className="container py-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Chats</h1>
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4 mr-2" />
          New Chat
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {chats.length === 0 ? (
            <div className="col-span-full py-10 text-center">
              <p className="text-muted-foreground">
                No chats found. Create your first chat to get started!
              </p>
            </div>
          ) : (
            chats.map((chat) => (
              <ChatItem
                key={chat.id}
                chat={chat}
                onChatSelected={() => router.push(`/chats/${chat.id}`)}
              />
            ))
          )}
        </div>
      )}

      <CreateChatDialog
        open={open}
        onOpenChange={setOpen}
        onChatCreated={handleChatCreated}
      />

      {/* Interactive tutorial */}
      {/* {showTutorial && (
        <ChatTutorial
          onDismiss={handleDismissTutorial}
          onCreateChat={handleCreateFromTutorial}
        />
      )} */}
    </div>
  );
};

export default ChatsPage;
