'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import {
  ArrowLeft,
  Loader2,
  MessageSquare,
  Pencil,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Chat {
  id: string;
  title: string;
  createdAt: string;
  updatedAt?: string;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt?: string;
  icon: string | null;
  color: string | null;
}

interface PageParams {
  pid: string;
}

interface PageProps {
  params: Promise<PageParams>;
}

export default function ProjectPage(props: PageProps) {
  // Properly unwrap params using React.use()
  const unwrappedParams = use(props.params);
  const pid = unwrappedParams.pid; // Safe to access directly since we've properly typed it

  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [projectId, setProjectId] = useState<string | null>(pid);
  const [chatIds, setChatIds] = useState<string[] | null>(null);

  async function fetchProjectDetails() {
    if (!projectId) {
      toast.error('Invalid project ID');
      router.push('/projects');
      return;
    }

    try {
      setLoading(true);
      // Use the project ID from the component state
      const currentPid = projectId;

      // Fetch project details
      const projectResponse = await fetch(`/api/projects/${currentPid}`);

      // Add debug logging
      console.log(`Project fetch status: ${projectResponse.status}`);

      if (!projectResponse.ok) {
        if (projectResponse.status === 404) {
          toast.error('Project not found');
          router.push('/projects');
          return;
        } else if (projectResponse.status === 401) {
          toast.error('Authentication required');
          // Optionally redirect to login
          return;
        }
        throw new Error('Failed to fetch project details');
      }

      const projectData = await projectResponse.json();
      const projectDetails = projectData.project;
      setProject(projectDetails);

      // Fetch project chats
      const chatsResponse = await fetch(`/api/projects/${currentPid}/chats`);
      console.log(`Chats fetch status: ${chatsResponse.status}`);

      if (!chatsResponse.ok) {
        if (chatsResponse.status === 401) {
          toast.error('Authentication required for chat access');
          return;
        }
        throw new Error('Failed to fetch project chats');
      }

      const chatsData = await chatsResponse.json();
      setChats(chatsData.chats || []);
      setChatIds(chatsData.chats?.map((chat: Chat) => chat.id) || []);
    } catch (error) {
      console.error('Error fetching project details:', error);
      toast.error('Failed to load project details');
    } finally {
      setLoading(false);
    }
  }

  const handleDeleteProject = async () => {
    if (!project) return;

    if (
      !confirm(
        `Are you sure you want to delete "${project.name}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete project');
      }

      toast.success('Project deleted successfully');
      router.push('/projects');
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    }
  };

  useEffect(() => {
    if (pid) {
      setProjectId(pid);
      fetchProjectDetails();
    }
    console.log('Project ID:', projectId);
    // Only depend on specific dependencies to avoid unnecessary rerenders
  }, [pid, router]);

  if (loading) {
    return (
      <div className="container py-10 flex items-center justify-center">
        <Loader2 className="size-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container py-10 text-center">
        <h1 className="text-2xl font-bold">Project not found</h1>
        <p className="text-muted-foreground mt-2">
          The project you&apos;re looking for doesn&apos;t exist or you
          don&apos;t have access to it.
        </p>
        <Button className="mt-4" onClick={() => router.push('/projects')}>
          <ArrowLeft className="mr-2 size-4" />
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => router.push('/projects')}>
          <ArrowLeft className="mr-2 size-4" />
          Back to Projects
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Options
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => router.push(`/projects/${projectId}/edit`)}
            >
              <Pencil className="size-4 mr-2" />
              Edit Project
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={handleDeleteProject}
            >
              <Trash2 className="size-4 mr-2" />
              Delete Project
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span
            className="text-4xl"
            style={{ color: project.color || undefined }}
          >
            {project.icon || '📁'}
          </span>
          <h1 className="text-3xl font-bold">{project.name}</h1>
        </div>
        {project.description && (
          <p className="text-muted-foreground mt-2 text-lg">
            {project.description}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-2">
          Created{' '}
          {project.createdAt
            ? format(new Date(project.createdAt), 'PPP')
            : 'Unknown'}
        </p>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Chats in this Project</h2>
        <Button onClick={() => router.push(`/projects/${projectId}/chat/new`)}>
          <MessageSquare className="mr-2 size-4" />
          New Chat
        </Button>
      </div>

      {chats.length === 0 ? (
        <div className="py-10 text-center bg-muted/40 rounded-lg">
          <p className="text-muted-foreground mt-2">
            It looks like you don&apos;t have any chats in this project yet.
            Click the &apos;New Chat&apos; button to create your first chat!
          </p>
          <Button
            className="mt-4"
            onClick={() => router.push(`/projects/${projectId}/chat/new`)}
          >
            <MessageSquare className="mr-2 size-4" />
            Create your first chat
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {chats.map((chat) => (
            <Card
              key={chat.id}
              onClick={() =>
                router.push(`/projects/${projectId}/chat/${chat.id}`)
              }
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg truncate">{chat.title}</CardTitle>
                <CardDescription className="text-xs">
                  {chat.createdAt
                    ? format(new Date(chat.createdAt), 'PPP')
                    : 'Unknown'}
                </CardDescription>
              </CardHeader>
              <CardFooter className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() =>
                    router.push(`/projects/${projectId}/chat/${chat.id}`)
                  }
                >
                  Open Chat
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
