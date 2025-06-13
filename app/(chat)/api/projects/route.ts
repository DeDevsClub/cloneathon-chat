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
    // Using console.error for better visibility in server logs
    console.error('DEBUG - GET - ALL COOKIES:', JSON.stringify([...request.cookies.getAll().map(c => ({name: c.name, value: c.value?.slice(0, 10) + '...'}))]));  
    
    // Try multiple possible session cookie names
    const sessionCookie = 
      request.cookies.get('user-session') || 
      request.cookies.get('next-auth.session-token') || 
      request.cookies.get('__Secure-next-auth.session-token') ||
      request.cookies.get('authjs.session-token');
      
    if (!sessionCookie?.value) {
      console.error('DEBUG - GET - No valid session cookie found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.error('DEBUG - GET - Using session cookie:', sessionCookie.name);

    // Parse the session cookie value to get user email
    const sessionData = JSON.parse(decodeURIComponent(sessionCookie.value));
    const email = sessionData.email;

    if (!email) {
      console.error('DEBUG - GET - Invalid session');
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
    // Using console.error for better visibility in server logs
    console.error('DEBUG - POST - ALL COOKIES:', JSON.stringify([...request.cookies.getAll().map(c => ({name: c.name, value: c.value?.slice(0, 10) + '...'}))])); 
    
    // Try multiple possible session cookie names
    const sessionCookie = 
      request.cookies.get('user-session') || 
      request.cookies.get('next-auth.session-token') || 
      request.cookies.get('__Secure-next-auth.session-token') ||
      request.cookies.get('authjs.session-token');
      
    if (!sessionCookie?.value) {
      console.error('DEBUG - POST - No valid session cookie found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.error('DEBUG - POST - Using session cookie:', sessionCookie.name);

    // Parse the session cookie value to get user email - matching GET function
    const sessionData = JSON.parse(decodeURIComponent(sessionCookie.value));
    const email = sessionData.email;
    console.error({ email });
    if (!email) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
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
