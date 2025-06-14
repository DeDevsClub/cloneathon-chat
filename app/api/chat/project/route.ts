import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getToken } from 'next-auth/jwt';
import { updateChatProject } from '@/lib/db/chat';
import { getUser } from '@/lib/db/queries';

// Helper function to extract email from different cookie formats
async function extractEmailFromCookie(
  request: NextRequest,
  cookieName: string,
) {
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

// Schema for updating chat project association
const updateChatProjectSchema = z.object({
  chatId: z.string().uuid(),
  projectId: z.string().uuid().nullable(),
});

// PATCH /api/chat/project - Update a chat's project association
export async function PATCH(request: NextRequest) {
  try {
    console.log('PATCH /api/chat/project - Updating chat project association');
    
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
        console.log(`Trying cookie: ${cookieName}`);
        email = await extractEmailFromCookie(request, cookieName);
        if (email) {
          console.log(`Found valid email in cookie ${cookieName}: ${email}`);
          break;
        }
      }
    }

    if (!email) {
      console.error('No valid session found or could not extract email');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [user] = await getUser(email);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse and validate request body
    const body = await request.json();
    console.log('Request body:', JSON.stringify(body));
    
    const validationResult = updateChatProjectSchema.safeParse(body);

    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error);
      return NextResponse.json(
        { error: validationResult.error.errors },
        { status: 400 },
      );
    }

    const { chatId, projectId } = validationResult.data;
    
    // Log the validated data
    console.log('Validated chat project update data:', {
      chatId,
      projectId: projectId || null,
    });

    // Update the chat's project association
    const updatedChat = await updateChatProject({
      chatId,
      projectId: projectId || null,
    });

    return NextResponse.json({ chat: updatedChat }, { status: 200 });
  } catch (error) {
    console.error('Error updating chat project association:', error);
    return NextResponse.json(
      { error: 'Failed to update chat project association' },
      { status: 500 },
    );
  }
}
