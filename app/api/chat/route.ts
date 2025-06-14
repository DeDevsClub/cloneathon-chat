import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getToken } from 'next-auth/jwt';
import { createChat } from '@/lib/db/chat';
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

// Schema for chat creation
const createChatSchema = z.object({
  id: z.string().uuid(),
  title: z.string().optional().default('New Chat'),
  visibility: z.enum(['public', 'private']).default('private'),
  projectId: z.string().uuid().optional().nullable(),
  selectedChatModel: z.string().optional(),
  message: z.object({
    id: z.string().optional(),
    content: z.string().optional(),
    parts: z.array(
      z.object({
        text: z.string().optional(),
        type: z.string().optional(),
      })
    ).optional(),
    role: z.string().optional(),
    createdAt: z.string().optional(),
    experimental_attachments: z.array(z.any()).optional(),
  }).optional(),
});

// POST /api/chat - Create a new chat
export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/chat - Creating a new chat');
    
    // Try extracting email from different possible session cookie names
    let email = null;

    // Try each possible cookie name
    const cookieNames = [
      'user-session',
      'next-auth.session-token',
      '__Secure-next-auth.session-token',
      'authjs.session-token',
    ];

    // Log available cookies for debugging
    console.log('Available cookies:', request.cookies.getAll().map(c => c.name).join(', '));

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
    
    const validationResult = createChatSchema.safeParse(body);

    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error);
      return NextResponse.json(
        { error: validationResult.error.errors },
        { status: 400 },
      );
    }

    const { id, title, visibility, projectId } = validationResult.data;

    // Log the validated data
    console.log('Validated chat creation data:', {
      id,
      userId: user.id,
      title: title || 'New Chat',
      visibility,
      projectId: projectId || null,
    });
    
    // Create the chat
    const newChat = await createChat({
      id,
      userId: user.id,
      title: title || 'New Chat',
      visibility,
      projectId: projectId || null,
    });

    return NextResponse.json({ chat: newChat }, { status: 201 });
  } catch (error) {
    console.error('Error creating chat:', error);
    return NextResponse.json(
      { error: 'Failed to create chat' },
      { status: 500 },
    );
  }
}
