import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getProject, updateProject, deleteProject } from '@/lib/db/project';
import { getUser } from '@/lib/db/queries';

// Schema for project updates
const updateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(255).optional(),
  description: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
});

// Helper to validate user ownership of project
async function validateUserOwnership(projectId: string, userEmail: string) {
  try {
    const [user] = await getUser(userEmail);
    if (!user) {
      return { error: 'User not found', status: 404 };
    }

    const project = await getProject({ id: projectId });
    if (project.userId !== user.id) {
      return {
        error: 'Unauthorized: You do not own this project',
        status: 403,
      };
    }

    return { user, project };
  } catch (error: any) {
    if (error?.message?.includes('not found')) {
      return { error: `Project with id ${projectId} not found`, status: 404 };
    }
    return { error: 'Server error', status: 500 };
  }
}

// GET /api/projects/[id] - Get a specific project
export async function GET(request: NextRequest, context: any) {
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

    const validation = await validateUserOwnership(context.params.id, email);
    if ('error' in validation) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status },
      );
    }

    return NextResponse.json({ project: validation.project });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 },
    );
  }
}

// PATCH /api/projects/[id] - Update a project
export async function PATCH(request: NextRequest, context: any) {
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

    const validation = await validateUserOwnership(context.params.id, email);
    if ('error' in validation) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status },
      );
    }

    const body = await request.json();
    const schema = updateProjectSchema.safeParse(body);

    if (!schema.success) {
      return NextResponse.json({ error: schema.error.errors }, { status: 400 });
    }

    const updatedProject = await updateProject({
      id: context.params.id,
      name: schema.data.name,
      //   todo: handle optional fields
      description: schema.data.description || '',
      icon: schema.data.icon || undefined,
      color: schema.data.color || '#4f46e5',
    });

    return NextResponse.json({ project: updatedProject });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 },
    );
  }
}

// DELETE /api/projects/[id] - Delete a project
export async function DELETE(request: NextRequest, context: any) {
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

    const validation = await validateUserOwnership(context.params.id, email);
    // console.log({ validation });
    if ('error' in validation) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status },
      );
    }

    await deleteProject({ id: context.params.id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 },
    );
  }
}
