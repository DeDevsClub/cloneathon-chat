import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from '@/components/ui/table';
import { getChatsByUserId } from '@/lib/db/queries';
import { auth } from '@/app/(auth)/auth'; // Assuming auth gives user session
import Link from 'next/link';
import { Badge } from '@/components/ui/badge'; // For visibility
import { formatDistanceToNow } from 'date-fns'; // For user-friendly dates
import 'node:fs';

// Helper function to format date (can be moved to a utils file)
function formatDate(dateString: string | Date): string {
  try {
    const date =
      typeof dateString === 'string' ? new Date(dateString) : dateString;
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

export default async function ChatList() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Please log in to see your chat history.
      </div>
    );
  }

  // Fetch chats - initial load, no pagination yet
  // We might need to adjust the limit and pagination parameters later
  const chats = await getChatsByUserId({
    id: userId,
    limit: 50, // Adjust as needed
    startingAfter: null,
    endingBefore: null,
  });

  if (!chats || chats.chats.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        You have no chats yet. Start a new conversation!
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-6 text-3xl font-semibold tracking-tight">Chats</h1>
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-2/5">Title</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead>Visibility</TableHead>
              <TableHead className="text-right">Chat</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {chats.chats.map((chat) => (
              <TableRow key={chat.id} className="hover:bg-muted/50">
                <TableCell className="font-medium">
                  <Link href={`/chats/${chat.id}`} className="hover:underline">
                    {chat.title || 'Untitled Chat'}
                  </Link>
                </TableCell>
                <TableCell>{formatDate(chat.updatedAt)}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      chat.visibility === 'public' ? 'default' : 'secondary'
                    }
                  >
                    {chat.visibility}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {chat.projectId || (
                    <span className="text-xs text-muted-foreground">N/A</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          {chats.chats.length > 10 && (
            <TableCaption>
              Showing your {chats.chats.length} most recent chats.
            </TableCaption>
          )}
        </Table>
      </div>
    </div>
  );
}
