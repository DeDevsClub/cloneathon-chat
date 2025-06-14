'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

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

const NewProjectPage = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      icon: '🦋', // Default folder icon
      color: '#4f46e5', // Default indigo color
    },
  });

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create project');
      }

      const { project } = await response.json();
      // console.log({ project });
      toast.success('Project created successfully');
      router.push(`/projects/${project.id}`);
    } catch (error: any) {
      console.error('Error creating project:', error);
      toast.error(error.message || 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container py-6 max-w-3xl mx-auto">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => router.push('/projects')}
      >
        <ArrowLeft className="mr-2 size-4" />
        Back to Projects
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Create New Project</CardTitle>
          <CardDescription>
            Create a new project to organize your chats. Projects help you group
            related conversations together.
          </CardDescription>
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
                            {field.value || '🦋'}
                          </div>
                          <Input
                            placeholder="🦋"
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
                  onClick={() => router.push('/projects')}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Project'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewProjectPage;
