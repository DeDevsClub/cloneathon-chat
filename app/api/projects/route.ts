import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getToken } from 'next-auth/jwt';

import { createProject, getProjects } from '@/lib/db/project';
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
        // console.error(`Failed to decode JWT token: ${jwtError}`);
        return null;
      }
    } else {
      // Handle JSON formatted cookies
      const data = JSON.parse(decodeURIComponent(cookie.value));
      return data.email;
    }
  } catch (error) {
    // console.error(`Error extracting email from ${cookieName}:`, error);
    return null;
  }
}

// Schema for project creation
const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(255),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
});

// GET /api/projects - Get all projects for the current user
export async function GET(request: NextRequest) {
  try {
    // Using console.error for better visibility in server logs
    console.error(`DEBUG - GET - ALL COOKIES: ${JSON.stringify([...request.cookies.getAll().map(c => ({name: c.name, value: `${c.value?.slice(0, 10)}...`}))])}`);

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
        console.error(`DEBUG - GET - Trying cookie: ${cookieName}`);
        email = await extractEmailFromCookie(request, cookieName);
        if (email) {
          console.error(
            `DEBUG - GET - Found valid email in cookie ${cookieName}: ${email}`,
          );
          break;
        }
      }
    }

    if (!email) {
      console.error(
        'DEBUG - GET - No valid session found or could not extract email',
      );
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [user] = await getUser(email);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const projects = await getProjects({ userId: user.id });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 },
    );
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    // Using console.error for better visibility in server logs
    console.error(
      `DEBUG - POST - ALL COOKIES: ${JSON.stringify([...request.cookies.getAll().map((c) => ({ name: c.name, value: `${c.value?.slice(0, 10)}...` }))])}`,
    );

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
        console.error(`DEBUG - POST - Trying cookie: ${cookieName}`);
        email = await extractEmailFromCookie(request, cookieName);
        if (email) {
          console.error(
            `DEBUG - POST - Found valid email in cookie ${cookieName}: ${email}`,
          );
          break;
        }
      }
    }

    if (!email) {
      console.error(
        'DEBUG - POST - No valid session found or could not extract email',
      );
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [user] = await getUser(email);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const validation = createProjectSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors },
        { status: 400 },
      );
    }

    const { name, description, icon, color } = validation.data;

    const project = await createProject({
      name,
      description,
      userId: user.id,
      icon,
      color,
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 },
    );
  }
}
