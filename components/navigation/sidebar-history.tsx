'use client';

import { isToday, isYesterday, subMonths, subWeeks } from 'date-fns';
import { useParams, useRouter } from 'next/navigation';
import type { User } from 'next-auth';
import { useState } from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  useSidebar,
} from '@/components/ui/sidebar';
import type { Chat } from '@/lib/db/schema';
import { fetcher } from '@/lib/utils';
import { ChatItem } from '@/components/navigation/sidebar-history-item';
import useSWRInfinite from 'swr/infinite';
import { LoaderIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Calendar, FolderOpen } from 'lucide-react';
import { ChatUsageIndicator } from '@/components/navigation/chat-usage-indicator';

type GroupedChats = {
  today: Chat[];
  yesterday: Chat[];
  lastWeek: Chat[];
  lastMonth: Chat[];
  older: Chat[];
};

type ProjectGroupedChats = {
  [projectName: string]: ChatWithProject[];
};

type ChatWithProject = Chat & {
  projectName: string | null;
  projectDescription: string | null;
  projectIcon: string | null;
  projectColor: string | null;
};

export interface ChatHistory {
  chats: Array<Chat | ChatWithProject>;
  hasMore: boolean;
}

export const PAGE_SIZE = 20;

const groupChatsByDate = (chats: Chat[]): GroupedChats => {
  const now = new Date();
  const oneWeekAgo = subWeeks(now, 1);
  const oneMonthAgo = subMonths(now, 1);

  return chats.reduce(
    (groups, chat) => {
      const chatDate = new Date(chat.createdAt);

      if (isToday(chatDate)) {
        groups.today.push(chat);
      } else if (isYesterday(chatDate)) {
        groups.yesterday.push(chat);
      } else if (chatDate > oneWeekAgo) {
        groups.lastWeek.push(chat);
      } else if (chatDate > oneMonthAgo) {
        groups.lastMonth.push(chat);
      } else {
        groups.older.push(chat);
      }

      return groups;
    },
    {
      today: [],
      yesterday: [],
      lastWeek: [],
      lastMonth: [],
      older: [],
    } as GroupedChats,
  );
};

const groupChatsByProject = (chats: ChatWithProject[]): ProjectGroupedChats => {
  return chats.reduce((groups, chat) => {
    const projectName = chat.projectName || 'No Project';
    if (!groups[projectName]) {
      groups[projectName] = [];
    }
    groups[projectName].push(chat);
    return groups;
  }, {} as ProjectGroupedChats);
};

export function getChatHistoryPaginationKey(
  pageIndex: number,
  previousPageData: ChatHistory,
  groupBy: 'date' | 'project' = 'date',
) {
  if (previousPageData && previousPageData.hasMore === false) {
    return null;
  }

  if (pageIndex === 0) return `/api/chats/history?limit=${PAGE_SIZE}&group_by=${groupBy}`;

  const firstChatFromPage = previousPageData.chats.at(-1);

  if (!firstChatFromPage) return null;

  return `/api/chats/history?ending_before=${firstChatFromPage.id}&limit=${PAGE_SIZE}&group_by=${groupBy}`;
}

export function SidebarHistory({ user }: { user: User | undefined }) {
  const { setOpenMobile } = useSidebar();
  const { id } = useParams();
  const [groupBy, setGroupBy] = useState<'date' | 'project'>('project');

  const {
    data: paginatedChatHistories,
    setSize,
    isValidating,
    isLoading,
    mutate,
  } = useSWRInfinite<ChatHistory>(
    (pageIndex, previousPageData) => getChatHistoryPaginationKey(pageIndex, previousPageData, groupBy), 
    fetcher, 
    {
      fallbackData: [],
    }
  );

  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const hasReachedEnd = paginatedChatHistories
    ? paginatedChatHistories.some((page) => page.hasMore === false)
    : false;

  const hasEmptyChatHistory = paginatedChatHistories
    ? paginatedChatHistories.every((page) => page.chats.length === 0)
    : false;

  const handleDelete = async () => {
    console.log('Attempting to delete chat with ID:', deleteId);
    const deletePromise = fetch(`/api/chats?chatId=${deleteId}`, {
      method: 'DELETE',
    });

    toast.promise(deletePromise, {
      loading: 'Deleting chat...',
      success: () => {
        mutate((chatHistories) => {
          if (chatHistories) {
            return chatHistories.map((chatHistory) => ({
              ...chatHistory,
              chats: chatHistory.chats.filter((chat) => chat.id !== deleteId),
            }));
          }
        });

        return 'Chat deleted successfully';
      },
      error: 'Failed to delete chat',
    });

    setShowDeleteDialog(false);

    if (deleteId === id) {
      router.push('/');
    }
  };

  const handleRename = (chatId: string, newTitle: string) => {
    mutate((chatHistories) => {
      if (chatHistories) {
        return chatHistories.map((chatHistory) => ({
          ...chatHistory,
          chats: chatHistory.chats.map((chat) =>
            chat.id === chatId ? { ...chat, title: newTitle } : chat
          ),
        }));
      }
    });
  };

  if (!user) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="px-2 text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2">
            <div>Login to save your chat history</div>
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          {/* Group By Toggle */}
          <div className="flex flex-row gap-1 p-1 mb-2 bg-sidebar-accent rounded-md">
            <Button
              variant={groupBy === 'project' ? 'default' : 'ghost'}
              size="sm"
              className="flex-1 h-7 text-xs"
              onClick={() => setGroupBy('project')}
            >
              <FolderOpen className="h-3 w-3 mr-1" />
              Projects
            </Button>
            <Button
              variant={groupBy === 'date' ? 'default' : 'ghost'}
              size="sm"
              className="flex-1 h-7 text-xs"
              onClick={() => setGroupBy('date')}
            >
              <Calendar className="h-3 w-3 mr-1" />
              Date
            </Button>
          </div>

          <SidebarMenu>
            {isLoading && (
              <div className="flex flex-row gap-2 items-center p-2 text-zinc-500 dark:text-zinc-400">
                <div className="animate-spin">
                  <LoaderIcon />
                </div>
                <div>Loading Chats...</div>
              </div>
            )}

            {!isLoading && hasEmptyChatHistory && (
              <div className="px-2 text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2">
                <div>You have no chat history</div>
              </div>
            )}

            {!isLoading &&
              !hasEmptyChatHistory &&
              (() => {
                const allChats = paginatedChatHistories?.reduce(
                  (acc, page) => acc.concat(page.chats),
                  [] as (Chat | ChatWithProject)[],
                ) || [];

                if (groupBy === 'project') {
                  const projectGroupedChats = groupChatsByProject(allChats as ChatWithProject[]);
                  
                  return (
                    <div>
                      {Object.entries(projectGroupedChats)
                        .sort(([a], [b]) => {
                          // Sort so "No Project" comes last
                          if (a === 'No Project') return 1;
                          if (b === 'No Project') return -1;
                          return a.localeCompare(b);
                        })
                        .map(([projectName, projectChats]) => (
                          <div key={projectName}>
                            <div className="px-2 py-1 text-xs text-sidebar-foreground/50 flex items-center gap-2">
                              {projectChats[0]?.projectIcon ? (
                                <span>{projectChats[0].projectIcon}</span>
                              ) : (
                                <FolderOpen className="h-3 w-3" />
                              )}
                              {projectName}
                              <span className="text-xs text-sidebar-foreground/30">
                                ({projectChats.length})
                              </span>
                            </div>
                            {projectChats.map((chat) => (
                              <ChatItem
                                key={chat.id}
                                chat={chat}
                                isActive={chat.id === id}
                                onDelete={(chatId) => {
                                  setDeleteId(chatId);
                                  setShowDeleteDialog(true);
                                }}
                                onRename={(chatId, newTitle) => {
                                  handleRename(chatId, newTitle);
                                }}
                                setOpenMobile={setOpenMobile}
                              />
                            ))}
                          </div>
                        ))}
                    </div>
                  );
                } else {
                  const groupedChats = groupChatsByDate(allChats as Chat[]);
                  
                  return (
                    <div>
                      {groupedChats.today.length > 0 && (
                        <div>
                          <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                            Today
                          </div>
                          {groupedChats.today.map((chat) => (
                            <ChatItem
                              key={chat.id}
                              chat={chat}
                              isActive={chat.id === id}
                              onDelete={(chatId) => {
                                setDeleteId(chatId);
                                setShowDeleteDialog(true);
                              }}
                              onRename={(chatId, newTitle) => {
                                handleRename(chatId, newTitle);
                              }}
                              setOpenMobile={setOpenMobile}
                            />
                          ))}
                        </div>
                      )}

                      {groupedChats.yesterday.length > 0 && (
                        <div>
                          <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                            Yesterday
                          </div>
                          {groupedChats.yesterday.map((chat) => (
                            <ChatItem
                              key={chat.id}
                              chat={chat}
                              isActive={chat.id === id}
                              onDelete={(chatId) => {
                                setDeleteId(chatId);
                                setShowDeleteDialog(true);
                              }}
                              onRename={(chatId, newTitle) => {
                                handleRename(chatId, newTitle);
                              }}
                              setOpenMobile={setOpenMobile}
                            />
                          ))}
                        </div>
                      )}

                      {groupedChats.lastWeek.length > 0 && (
                        <div>
                          <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                            Last 7 days
                          </div>
                          {groupedChats.lastWeek.map((chat) => (
                            <ChatItem
                              key={chat.id}
                              chat={chat}
                              isActive={chat.id === id}
                              onDelete={(chatId) => {
                                setDeleteId(chatId);
                                setShowDeleteDialog(true);
                              }}
                              onRename={(chatId, newTitle) => {
                                handleRename(chatId, newTitle);
                              }}
                              setOpenMobile={setOpenMobile}
                            />
                          ))}
                        </div>
                      )}

                      {groupedChats.lastMonth.length > 0 && (
                        <div>
                          <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                            Last 30 days
                          </div>
                          {groupedChats.lastMonth.map((chat) => (
                            <ChatItem
                              key={chat.id}
                              chat={chat}
                              isActive={chat.id === id}
                              onDelete={(chatId) => {
                                setDeleteId(chatId);
                                setShowDeleteDialog(true);
                              }}
                              onRename={(chatId, newTitle) => {
                                handleRename(chatId, newTitle);
                              }}
                              setOpenMobile={setOpenMobile}
                            />
                          ))}
                        </div>
                      )}

                      {groupedChats.older.length > 0 && (
                        <div>
                          <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                            Older than last month
                          </div>
                          {groupedChats.older.map((chat) => (
                            <ChatItem
                              key={chat.id}
                              chat={chat}
                              isActive={chat.id === id}
                              onDelete={(chatId) => {
                                setDeleteId(chatId);
                                setShowDeleteDialog(true);
                              }}
                              onRename={(chatId, newTitle) => {
                                handleRename(chatId, newTitle);
                              }}
                              setOpenMobile={setOpenMobile}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }
              })()}
          </SidebarMenu>

          <motion.div
            onViewportEnter={() => {
              if (!isValidating && !hasReachedEnd) {
                setSize((size) => size + 1);
              }
            }}
          />

          {hasReachedEnd ? (
            <div className="px-2 text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2 mt-8">
              You have reached the end of your chat history.
            </div>
          ) : (
            <div className="p-2 text-zinc-500 dark:text-zinc-400 flex flex-row gap-2 items-center mt-8">
              <div className="animate-spin">
                <LoaderIcon />
              </div>
              <div>Loading Chats...</div>
            </div>
          )}
        </SidebarGroupContent>
      </SidebarGroup>

      <ChatUsageIndicator />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              chat and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
