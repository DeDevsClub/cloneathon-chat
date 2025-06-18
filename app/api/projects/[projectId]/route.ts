import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getProject, updateProject, deleteProject } from '@/lib/db/project';
import { getUser } from '@/lib/db/queries';
import { auth } from '@/app/(auth)/auth';

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

// GET /api/projects/[projectId] - Get a specific project
export async function GET(request: NextRequest) {
  // Extract projectId from URL
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const projectId = pathParts[pathParts.indexOf('projects') + 1];

  try {
    console.log(
      `DEBUG - GET project/${projectId} - Starting authentication check`,
    );

    // Use NextAuth session for authentication
    const session = await auth();
    console.log(
      `DEBUG - GET project/${projectId} - Session:`,
      session ? 'exists' : 'null',
    );

    if (!session || !session.user || !session.user.email) {
      console.log(`DEBUG - GET project/${projectId} - No valid session found`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = session.user.email;
    console.log(`DEBUG - GET project/${projectId} - User email: ${email}`);

    // Validate user ownership
    const validation = await validateUserOwnership(projectId, email);
    if (validation.error) {
      console.log(
        `DEBUG - GET project/${projectId} - Validation error: ${validation.error}`,
      );
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status },
      );
    }

    console.log(
      `DEBUG - GET project/${projectId} - Project found and user authorized`,
    );
    return NextResponse.json({
      project: validation.project,
      success: true,
    });
  } catch (error) {
    console.error(`DEBUG - GET project/${projectId} - Error:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// PATCH /api/projects/[projectId] - Update a project
export async function PATCH(request: NextRequest) {
  // Extract projectId from URL
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const projectId = pathParts[pathParts.indexOf('projects') + 1];
  console.log('Project ID (from api/projects/[projectId]):', projectId);
  try {
    // Use NextAuth session for authentication
    const session = await auth();
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = session.user.email;

    const validation = await validateUserOwnership(projectId, email);
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
      id: projectId,
      name: schema.data.name,
      //   todo: handle optional fields
      description: schema.data.description || '',
      icon: schema.data.icon || '',
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

// DELETE /api/projects/[projectId] - Delete a project
export async function DELETE(request: NextRequest) {
  // Extract projectId from URL
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const projectId = pathParts[pathParts.indexOf('projects') + 1];
  try {
    console.log('Deleting project:', projectId);
    // Use NextAuth session for authentication
    const session = await auth();
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = session.user.email;

    const validation = await validateUserOwnership(projectId, email);
    if ('error' in validation) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status },
      );
    }

    await deleteProject({ id: projectId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 },
    );
  }
}
