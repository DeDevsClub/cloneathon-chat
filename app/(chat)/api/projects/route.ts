import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createProject, getProjects } from '@/lib/db/project';
import { getUser } from '@/lib/db/queries';

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
    // Get user email from the session cookie
    const sessionCookie = request.cookies.get('user-session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse the session cookie value to get user email
    const sessionData = JSON.parse(decodeURIComponent(sessionCookie.value));
    const email = sessionData.email;

    if (!email) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
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
    const sessionCookie = request.cookies.get('user-session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [user] = await getUser(sessionCookie.value);

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
