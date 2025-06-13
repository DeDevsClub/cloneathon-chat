import { db } from './index';
import { ChatSDKError } from '../errors';
import { chat, project } from './schema';
import { eq, desc } from 'drizzle-orm';

interface CreateProjectParams {
  name: string;
  description?: string;
  userId: string;
  icon?: string;
  color?: string;
}

interface UpdateProjectParams {
  id: string;
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
}

export async function createProject({
  name,
  description,
  userId,
  icon,
  color,
}: CreateProjectParams) {
  try {
    const [newProject] = await db
      .insert(project)
      .values({
        name,
        description,
        userId,
        icon,
        color,
      })
      .returning();

    return newProject;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to create project');
  }
}

export async function getProjects({ userId }: { userId: string }) {
  try {
    const projects = await db
      .select()
      .from(project)
      .where(eq(project.userId, userId))
      .orderBy(desc(project.updatedAt));

    return projects;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get projects by user id',
    );
  }
}

export async function getProject({ id }: { id: string }) {
  try {
    const [foundProject] = await db
      .select()
      .from(project)
      .where(eq(project.id, id))
      .limit(1);

    if (!foundProject) {
      throw new ChatSDKError(
        'not_found:database',
        `Project with id ${id} not found`,
      );
    }

    return foundProject;
  } catch (error) {
    if (error instanceof ChatSDKError) {
      throw error;
    }

    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get project by id',
    );
  }
}

export async function updateProject({
  id,
  name,
  description,
  icon,
  color,
}: UpdateProjectParams) {
  try {
    // First check if project exists and belongs to the user
    const [foundProject] = await db
      .select()
      .from(project)
      .where(eq(project.id, id))
      .limit(1);

    if (!foundProject) {
      throw new ChatSDKError(
        'not_found:database',
        `Project with id ${id} not found`,
      );
    }

    const updateValues: Partial<typeof foundProject> = {};
    if (name !== undefined) updateValues.name = name;
    if (description !== undefined) updateValues.description = description;
    if (icon !== undefined) updateValues.icon = icon;
    if (color !== undefined) updateValues.color = color;
    updateValues.updatedAt = new Date();

    const [updatedProject] = await db
      .update(project)
      .set(updateValues)
      .where(eq(project.id, id))
      .returning();

    return updatedProject;
  } catch (error) {
    if (error instanceof ChatSDKError) {
      throw error;
    }

    throw new ChatSDKError('bad_request:database', 'Failed to update project');
  }
}

export async function deleteProject({ id }: { id: string }) {
  try {
    // Check if project exists first
    const [foundProject] = await db
      .select()
      .from(project)
      .where(eq(project.id, id))
      .limit(1);

    if (!foundProject) {
      throw new ChatSDKError(
        'not_found:database',
        `Project with id ${id} not found`,
      );
    }

    // Delete the project
    await db.delete(project).where(eq(project.id, id));

    return { success: true };
  } catch (error) {
    if (error instanceof ChatSDKError) {
      throw error;
    }

    throw new ChatSDKError('bad_request:database', 'Failed to delete project');
  }
}

export async function getProjectChats({ projectId }: { projectId: string }) {
  try {
    // Check if project exists first
    const [foundProject] = await db
      .select()
      .from(project)
      .where(eq(project.id, projectId))
      .limit(1);

    if (!foundProject) {
      throw new ChatSDKError(
        'not_found:database',
        `Project with id ${projectId} not found`,
      );
    }

    const chats = await db
      .select()
      .from(chat)
      .where(eq(chat.projectId, projectId))
      .orderBy(desc(chat.createdAt));

    return chats;
  } catch (error) {
    if (error instanceof ChatSDKError) {
      throw error;
    }

    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get project chats',
    );
  }
}
