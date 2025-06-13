'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

// Form validation schema
const formSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(255, 'Project name is too long'),
  description: z.string().optional(),
  icon: z.string().max(10, 'Icon should be at most 10 characters').optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color')
    .optional(),
});

type FormValues = z.infer<typeof formSchema>;

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

const EditProjectPage = (props: PageProps) => {
  // Properly unwrap params using React.use()
  const unwrappedParams = use(props.params);
  const projectId = unwrappedParams.pid;
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      icon: '📁',
      color: '#4f46e5',
    },
  });

  useEffect(() => {
    async function fetchProject() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/projects/${projectId}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError('Project not found');
            return;
          }
          throw new Error('Failed to fetch project');
        }

        const data = await response.json();
        setProject(data.project);

        // Set form values
        form.reset({
          name: data.project.name,
          description: data.project.description || '',
          icon: data.project.icon || '📁',
          color: data.project.color || '#4f46e5',
        });
      } catch (err) {
        console.error('Error fetching project:', err);
        setError('Failed to load project details');
        toast.error('Failed to load project details');
      } finally {
        setIsLoading(false);
      }
    }

    fetchProject();
  }, [projectId, form]);

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update project');
      }

      const { project } = await response.json();
      toast.success('Project updated successfully');
      router.push(`/projects/${project.id}`);
    } catch (error: any) {
      console.error('Error updating project:', error);
      toast.error(error.message || 'Failed to update project');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="container py-10 flex items-center justify-center">
        <Loader2 className="size-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="container py-10 text-center">
        <h1 className="text-2xl font-bold">Error</h1>
        <p className="text-muted-foreground mt-2">
          {error || 'Failed to load project'}
        </p>
        <Button className="mt-4" onClick={() => router.push('/projects')}>
          <ArrowLeft className="mr-2 size-4" />
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-6 max-w-3xl mx-auto">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => router.push(`/projects/${projectId}`)}
      >
        <ArrowLeft className="mr-2 size-4" />
        Back to Project
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Edit Project</CardTitle>
          <CardDescription>Update your project details.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name</FormLabel>
                    <FormControl>
                      <Input placeholder="My Project" {...field} autoFocus />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Description of your project"
                        className="resize-none h-24"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Icon (emoji)</FormLabel>
                      <FormControl>
                        <div className="flex gap-3 items-center">
                          <div className="size-12 flex items-center justify-center text-3xl border rounded-md">
                            {field.value || '📁'}
                          </div>
                          <Input
                            placeholder="📁"
                            {...field}
                            value={field.value || ''}
                            className="flex-1"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Color</FormLabel>
                      <FormControl>
                        <div className="flex gap-3 items-center">
                          <Input
                            type="color"
                            className="size-12 p-1 cursor-pointer rounded-md"
                            {...field}
                            value={field.value || '#4f46e5'}
                          />
                          <Input
                            placeholder="#4f46e5"
                            {...field}
                            value={field.value || '#4f46e5'}
                            className="flex-1"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="pt-4 flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/projects/${projectId}`)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditProjectPage;
