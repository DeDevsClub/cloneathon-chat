import { db } from './index';
import { ChatSDKError } from '../errors';
import { chat, project, message } from './schema';
import { eq, desc } from 'drizzle-orm';
import { generateUUID } from '../utils';

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

/**
 * Creates a default project with a tutorial chat for a new user
 * This function creates a welcome project with a guided tutorial chat
 * to help new users get familiar with the application
 */
export async function createDefaultProjectWithTutorial(userId: string) {
  try {
    // 1. Create a default project
    const projectId = generateUUID();
    const [newProject] = await db
      .insert(project)
      .values({
        id: projectId,
        name: 'Getting Started',
        description:
          'Welcome to your AI chat app! This project contains tutorial chats to help you get started.',
        userId,
        icon: '✨',
        color: '#6366f1', // Indigo color
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // 2. Create a tutorial chat
    const chatId = generateUUID();
    await db.insert(chat).values({
      id: chatId,
      title: 'Welcome Tutorial',
      userId,
      projectId,
      createdAt: new Date(),
      visibility: 'private',
    });

    // 3. Add tutorial messages
    const welcomeMessages = [
      {
        id: generateUUID(),
        chatId,
        role: "assistant",
        parts: JSON.stringify([{
          text: "# 👋 Welcome to Your AI Chat Assistant!\n\nI'm here to help you be more productive and creative. Let me show you around to get started."
        }]),
        attachments: JSON.stringify([]),
        createdAt: new Date(),
        contentType: "markdown",
        textContent: "Welcome to Your AI Chat Assistant! I'm here to help you be more productive and creative. Let me show you around to get started."
      },
      {
        id: generateUUID(),
        chatId,
        role: "assistant",
        parts: JSON.stringify([{
          text: "## 📂 Working with Projects\n\nProjects help you organize your chats by topic or purpose. You can:\n\n- Create new projects from the sidebar\n- Add chats to specific projects\n- Share projects with your team (coming soon!)\n\nTry creating a new project for a topic you're interested in!"
        }]),
        attachments: JSON.stringify([]),
        createdAt: new Date(Date.now() + 2000), // Slight delay between messages
        contentType: "markdown",
        textContent: "Working with Projects. Projects help you organize your chats by topic or purpose."
      },
      {
        id: generateUUID(),
        chatId,
        role: "assistant",
        parts: JSON.stringify([{
          text: "## 💬 AI Capabilities\n\nI can help you with many tasks:\n\n- Answer questions on various topics\n- Generate creative content\n- Help with problem-solving\n- Provide information and explanations\n- Assist with code and technical topics\n\nJust ask me anything, and I'll do my best to assist you!"
        }]),
        attachments: JSON.stringify([]),
        createdAt: new Date(Date.now() + 4000),
        contentType: "markdown",
        textContent: "AI Capabilities. I can help you with many tasks: Answer questions, Generate creative content, Help with problem-solving, Provide information and explanations, Assist with code and technical topics."
      },
      {
        id: generateUUID(),
        chatId,
        role: "assistant",
        parts: JSON.stringify([{
          text: "## 🚀 Getting Started\n\n1. **Create a new project** for your specific needs\n2. **Start a new chat** within that project\n3. **Ask any question** or provide a task for me to help with\n\nDon't be afraid to experiment and try different prompts to see how I can assist you!"
        }]),
        attachments: JSON.stringify([]),
        createdAt: new Date(Date.now() + 6000),
        contentType: "markdown",
        textContent: "Getting Started. 1. Create a new project for your specific needs. 2. Start a new chat within that project. 3. Ask any question or provide a task for me to help with."
      },
      {
        id: generateUUID(),
        chatId,
        role: "assistant",
        parts: JSON.stringify([{
          text: "## 🤔 Need Help?\n\nIf you have any questions or need assistance with using this application, feel free to ask! I'm here to make your experience as smooth and productive as possible.\n\nWhat would you like to explore today?"
        }]),
        attachments: JSON.stringify([]),
        createdAt: new Date(Date.now() + 8000),
        contentType: "markdown",
        textContent: "Need Help? If you have any questions or need assistance with using this application, feel free to ask!"
      }
    ];

    await db.insert(message).values(welcomeMessages);

    return { project: newProject, chatId };
  } catch (error) {
    if (error instanceof ChatSDKError) {
      throw error;
    }

    console.error('Failed to create default project with tutorial:', error);
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to create default project with tutorial',
    );
  }
}
