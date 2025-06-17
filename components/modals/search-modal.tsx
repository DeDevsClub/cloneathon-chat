'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, Plus, Clock, MessageSquare, Folder } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

interface SearchModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

interface Chat {
  id: string;
  title: string;
  lastActivityAt: string;
  projectName?: string;
  projectIcon?: string;
}

interface ChatHistory {
  date: string;
  chats: Chat[];
}

// Fetcher function for SWR
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function SearchModal({ isOpen, onOpenChange }: SearchModalProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch recent chats using SWR
  const { data: chatHistories, error } = useSWR<ChatHistory[]>(
    session?.user && isOpen ? '/api/chats/history?limit=50' : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  // Flatten all chats from all date groups
  const allChats = useMemo(() => {
    if (!chatHistories) return [];
    return chatHistories.flatMap((history) => history.chats);
  }, [chatHistories]);

  // Filter chats based on search term
  const filteredChats = useMemo(() => {
    if (!searchTerm.trim()) {
      // Show recent chats (limit to 10 for better UX)
      return allChats.slice(0, 10);
    }

    const searchLower = searchTerm.toLowerCase();
    return allChats.filter(
      (chat) =>
        chat.title.toLowerCase().includes(searchLower) ||
        chat.projectName?.toLowerCase().includes(searchLower),
    );
  }, [allChats, searchTerm]);

  useEffect(() => {
    if (isOpen) {
      // Autofocus input when modal opens
      setTimeout(() => inputRef.current?.focus(), 100);
      // Reset search term when modal opens
      setSearchTerm('');
    }
  }, [isOpen]);

  const handleSelectConversation = (chatId: string) => {
    router.push(`/chats/${chatId}`);
    onOpenChange(false);
  };

  const handleStartNewChat = async () => {
    try {
      // Check chat count before creating new chat
      const countResponse = await fetch('/api/chats/count');
      if (countResponse.ok) {
        const countData = await countResponse.json();
        if (countData.count >= countData.maxCount) {
          toast.error(
            `You have reached the maximum number of chats allowed (${countData.maxCount}). Please delete some chats before creating new ones.`,
            {
              duration: 6000,
              action: {
                label: 'Manage Chats',
                onClick: () => {
                  router.push('/chats');
                  onOpenChange(false);
                },
              },
            },
          );
          return;
        }
      }

      // Navigate to new chat page with optional title
      const queryParams = searchTerm.trim()
        ? `?title=${encodeURIComponent(searchTerm.trim())}`
        : '';
      router.push(`/chats/new${queryParams}`);
      onOpenChange(false);
    } catch (error) {
      console.error('Error checking chat limits:', error);
      // If we can't check limits, still allow creation (will be caught by backend)
      const queryParams = searchTerm.trim()
        ? `?title=${encodeURIComponent(searchTerm.trim())}`
        : '';
      router.push(`/chats/new${queryParams}`);
      onOpenChange(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogOverlay className="bg-background/80 backdrop-blur-sm" />
      <DialogContent
        className="fixed left-1/2 top-1/4 w-full max-w-xl -translate-x-1/2 -translate-y-1/4 rounded-xl border-border bg-card p-0 text-foreground shadow-2xl outline-none"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="px-4 pt-4">
          <DialogTitle>Search Chats</DialogTitle>
          <DialogDescription>
            Search for existing chats or start a new one.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Search size={18} className="text-muted-foreground" />
          <span className="text-sm text-muted-foreground">/</span>
          <Plus size={16} className="text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search chats or press Enter to start new chat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (filteredChats.length > 0 && searchTerm) {
                  handleSelectConversation(filteredChats[0].id);
                } else {
                  handleStartNewChat();
                }
              } else if (e.key === 'Escape') {
                onOpenChange(false);
              }
            }}
            className="h-auto flex-1 border-0 bg-transparent p-0 text-sm text-foreground placeholder:text-muted-foreground focus:ring-0 focus-visible:ring-0"
          />
        </div>

        <div className="p-4">
          {/* Section header */}
          <div className="mb-3 flex items-center gap-2 text-xs font-medium text-muted-foreground">
            {searchTerm ? (
              <>
                <Search size={14} />
                Search Results ({filteredChats.length})
              </>
            ) : (
              <>
                <Clock size={14} />
                Recent Chats
              </>
            )}
          </div>

          {/* Loading state */}
          {isOpen && !chatHistories && !error && session?.user && (
            <div className="py-8 text-center">
              <div className="mx-auto size-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
              <p className="mt-2 text-sm text-muted-foreground">
                Loading chats...
              </p>
            </div>
          )}

          {/* Error state */}
          {error && (
            <p className="py-4 text-center text-sm text-destructive">
              Failed to load chats. Please try again.
            </p>
          )}

          {/* Chat list */}
          {filteredChats.length > 0 ? (
            <ul className="max-h-[300px] space-y-1 overflow-y-auto">
              {filteredChats.map((chat) => (
                <li key={chat.id}>
                  <Button
                    variant="ghost"
                    onClick={() => handleSelectConversation(chat.id)}
                    className="flex w-full items-center gap-3 justify-start rounded-md p-2 text-left text-sm hover:bg-muted h-auto"
                  >
                    <div className="flex items-center gap-2">
                      {chat.projectName ? (
                        <Folder size={16} className="text-muted-foreground" />
                      ) : (
                        <MessageSquare
                          size={16}
                          className="text-muted-foreground"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-foreground font-medium">
                        {chat.title}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {chat.projectName && (
                          <span className="truncate">{chat.projectName} •</span>
                        )}
                        <span>{formatDate(chat.lastActivityAt)}</span>
                      </div>
                    </div>
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            chatHistories && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                {searchTerm
                  ? 'No chats found matching your search.'
                  : 'No recent chats.'}
              </p>
            )
          )}

          {/* Start new chat option */}
          {(searchTerm || filteredChats.length === 0) && (
            <Button
              variant="ghost"
              onClick={handleStartNewChat}
              className="mt-4 flex w-full items-center gap-3 justify-start rounded-md p-2 text-left text-sm hover:bg-muted h-auto"
            >
              <Plus size={16} className="text-violet-400" />
              <span className="truncate text-violet-300">
                {searchTerm ? (
                  <>
                    Start new chat:{' '}
                    <span className="font-medium text-foreground">
                      {searchTerm}
                    </span>
                  </>
                ) : (
                  'Start new chat'
                )}
              </span>
            </Button>
          )}

          {/* Login prompt for unauthenticated users */}
          {!session?.user && (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                Please log in to search your chats.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  router.push('/login');
                  onOpenChange(false);
                }}
                className="mt-2"
              >
                Log In
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
