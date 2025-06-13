'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogOverlay } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, Plus, Clock, MessageSquare } from 'lucide-react';
// import { useChatStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/button';
// import type { Conversation } from '@/lib/types';

interface SearchModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function SearchModal({ isOpen, onOpenChange }: SearchModalProps) {
  const router = useRouter(); // Initialize router
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredConversations, setFilteredConversations] = useState<any[]>([]); // Show top 5 recent initially
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Autofocus input when modal opens
      setTimeout(() => inputRef.current?.focus(), 100);
      // Reset search term and show recent chats
      setSearchTerm('');
      setFilteredConversations([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchTerm) {
      setFilteredConversations([]);
    } else {
      setFilteredConversations([]); // Show recent if search is empty
    }
  }, [searchTerm]);

  const handleSelectConversation = (conversationId: string) => {
    // const storeSelectConversation = useChatStore(state => state.selectConversation); // If you want to sync global store selection
    // storeSelectConversation(conversationId);
    router.push(`/chat/${conversationId}`);
    onOpenChange(false); // Close modal on selection
  };

  const handleStartNewChat = () => {
    const newChatId = `chat_${Date.now().toString()}`;
    const newConversationEntry: any = {
      id: newChatId,
      title: searchTerm.trim()
        ? searchTerm.trim()
        : `New Chat ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      messages: [],
      createdAt: new Date(),
    };
    // addConversation(newConversationEntry);
    router.push(`/chat/${newChatId}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogOverlay className="bg-background/80 backdrop-blur-sm" />
      <DialogContent
        className="fixed left-1/2 top-1/4 w-full max-w-xl -translate-x-1/2 -translate-y-1/4 transform rounded-xl border-border bg-card p-0 text-foreground shadow-2xl outline-none"
        onOpenAutoFocus={(e) => e.preventDefault()} // Prevent default autofocus, we handle it manually
      >
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Search size={18} className="text-muted-foreground" />
          <span className="text-sm text-muted-foreground">/</span>
          <Plus size={16} className="text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search or press Enter to start new chat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (filteredConversations.length > 0 && searchTerm) {
                  handleSelectConversation(filteredConversations[0].id);
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
          {searchTerm === '' && ( // Only show "Recent Chats" if search is empty
            <div className="mb-3 flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Clock size={14} />
              Recent Chats
            </div>
          )}

          {filteredConversations.length > 0 ? (
            <ul className="max-h-[300px] space-y-1 overflow-y-auto">
              {filteredConversations.map((convo) => (
                <li key={convo.id}>
                  <Button
                    onClick={() => handleSelectConversation(convo.id)}
                    className="flex w-full items-center gap-3 rounded-md p-2 text-left text-sm hover:bg-muted"
                  >
                    <MessageSquare
                      size={16}
                      className="text-muted-foreground"
                    />
                    <span className="truncate text-foreground">
                      {convo.title}
                    </span>
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">
              {searchTerm ? 'No chats found.' : 'No recent chats.'}
            </p>
          )}

          {searchTerm && ( // Show "Start new chat" option if there's a search term
            <Button
              onClick={handleStartNewChat}
              className="mt-4 flex w-full items-center gap-3 rounded-md p-2 text-left text-sm hover:bg-muted"
            >
              <Plus size={16} className="text-violet-400" />
              <span className="truncate text-violet-300">
                Start new chat:{' '}
                <span className="font-medium text-foreground">
                  &quot;{searchTerm}&quot;
                </span>
              </span>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
