import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getToken } from 'next-auth/jwt';

import { getChatById } from '@/lib/db/queries';
import { getUser } from '@/lib/db/queries';
import { updateChatProject } from '@/lib/db/chat';

// Schema for chat project association updates
const updateChatProjectSchema = z.object({
  chatId: z.string().min(1, 'Chat ID is required'),
  projectId: z.string().min(1, 'Project ID is required'),
});

// Helper function to extract email from different cookie formats
async function extractEmailFromCookie(request: NextRequest, cookieName: string) {
  const cookie = request.cookies.get(cookieName);
  if (!cookie?.value) return null;
  
  try {
    if (cookieName.includes('auth')) {
      // Handle JWT token from NextAuth
      const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
      if (!secret) return null;
      
      try {
        // Use getToken to decode the JWT token
        const token = await getToken({ 
          req: request,
          secret,
          cookieName,
        });
        
        return (token?.email as string) || null;
      } catch (jwtError) {
        console.error(`Failed to decode JWT token: ${jwtError}`);
        return null;
      }
    } else {
      // Handle JSON formatted cookies
      const data = JSON.parse(decodeURIComponent(cookie.value));
      return data.email;
    }
  } catch (error) {
    console.error(`Error extracting email from ${cookieName}:`, error);
    return null;
  }
}

// PATCH /api/chat/project - Update a chat's project association
export async function PATCH(request: NextRequest) {
  try {
    console.error(`DEBUG - PATCH chat/project - ALL COOKIES: ${JSON.stringify([...request.cookies.getAll().map((c) => ({ name: c.name, value: `${c.value?.slice(0, 10)}...` }))])}`);
    
    // Try extracting email from different possible session cookie names
    let email = null;
    
    // Try each possible cookie name
    const cookieNames = [
      'user-session',
      'next-auth.session-token',
      '__Secure-next-auth.session-token',
      'authjs.session-token',
    ];
    
    for (const cookieName of cookieNames) {
      if (request.cookies.has(cookieName)) {
        console.error(`DEBUG - PATCH chat/project - Trying cookie: ${cookieName}`);
        email = await extractEmailFromCookie(request, cookieName);
        if (email) {
          console.error(`DEBUG - PATCH chat/project - Found valid email in cookie ${cookieName}: ${email}`);
          break;
        }
      }
    }
    
    if (!email) {
      console.error('DEBUG - PATCH chat/project - No valid session found or could not extract email');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [user] = await getUser(email);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse and validate request body
    const body = await request.json();
    const result = updateChatProjectSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.errors }, { status: 400 });
    }

    const { chatId, projectId } = result.data;
    
    // Verify chat ownership
    try {
      const chat = await getChatById({ id: chatId });
      
      if (!chat) {
        return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
      }
      
      if (chat.userId !== user.id) {
        return NextResponse.json(
          { error: 'You do not own this chat' },
          { status: 403 }
        );
      }
      
      // Update chat's project association
      const updatedChat = await updateChatProject({
        chatId,
        projectId,
      });
      
      return NextResponse.json({ chat: updatedChat });
    } catch (error: any) {
      console.error('Error updating chat project:', error);
      return NextResponse.json(
        { error: 'Failed to update chat project' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in chat project update API:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
