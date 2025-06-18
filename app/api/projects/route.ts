import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/app/(auth)/auth';

import { createProject, getProjects } from '@/lib/db/project';
import { getUser } from '@/lib/db/queries';

// Schema for project creation
const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(255),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
});

// GET /api/projects - Get all projects for authenticated user
export async function GET() {
  console.log('DEBUG - GET - Starting request processing');
  
  try {
    // Get session using NextAuth
    const session = await auth();
    console.log('DEBUG - GET - Session:', session ? 'Found' : 'Not found');
    
    if (!session || !session.user || !session.user.email) {
      console.log('DEBUG - GET - No valid session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = session.user.email;
    console.log('DEBUG - GET - Email from session:', email);

    // Get user from database
    const [user] = await getUser(email);
    if (!user) {
      console.log('DEBUG - GET - User not found for email:', email);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('DEBUG - GET - User found:', user.id);

    // Get projects for this user
    const projects = await getProjects({ userId: user.id });
    console.log('DEBUG - GET - Projects found:', projects.length);

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('DEBUG - GET - Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  console.log('DEBUG - POST - Starting request processing');
  
  try {
    // Get session using NextAuth
    const session = await auth();
    console.log('DEBUG - POST - Session:', session ? 'Found' : 'Not found');
    
    if (!session || !session.user || !session.user.email) {
      console.log('DEBUG - POST - No valid session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = session.user.email;
    console.log('DEBUG - POST - Email from session:', email);

    // Get user from database
    const [user] = await getUser(email);
    if (!user) {
      console.log('DEBUG - POST - User not found for email:', email);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('DEBUG - POST - User found:', user.id);

    // Parse and validate request body
    const body = await request.json();
    console.log('DEBUG - POST - Request body:', body);

    const validation = createProjectSchema.safeParse(body);
    if (!validation.success) {
      console.log('DEBUG - POST - Validation failed:', validation.error.errors);
      return NextResponse.json({ error: validation.error.errors }, { status: 400 });
    }

    const { name, description, icon, color } = validation.data;
    console.log('DEBUG - POST - Creating project with:', { name, description, icon, color, userId: user.id });

    // Create the project
    const project = await createProject({
      name,
      description,
      userId: user.id,
      icon,
      color,
    });

    console.log('DEBUG - POST - Project created successfully:', project.id);
    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error('DEBUG - POST - Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
