import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Project } from '@/lib/db/schema';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { useSession } from 'next-auth/react';

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

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectCreated: (project: Project) => void;
}

export function CreateProjectDialog({
  open,
  onOpenChange,
  onProjectCreated,
}: CreateProjectDialogProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: session } = useSession();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      icon: '🦋', // Default folder icon
      color: '#4f46e5', // Default indigo color
    },
  });

  /**
   * Handles the submission of the project creation form.
   * - Sends a POST request to the server to create a new project with the given form values.
   * - Displays a success toast and refreshes the router on successful project creation.
   * - Handles errors by displaying appropriate error messages and redirecting guests to the login page if necessary.
   *
   * @param {FormValues} values - The form values to be submitted for project creation.
   */
  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    // console.log({ user: session?.user });
    // console.log('Available cookies:', document.cookie);
    const isGuest = session?.user?.type === 'guest';
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        // console.log({ error });
        if (isGuest) {
          toast.error('Authentication Required', {
            description:
              'Please sign in with your account to create and manage projects.',
            action: {
              label: 'Sign In',
              onClick: () => router.push('/login'),
            },
            duration: 5000,
          });
          setTimeout(() => router.push('/login'), 2000);
          return;
        }
        const error = await response.json();
        throw new Error(error.message || 'Failed to create project');
      }

      const { project } = await response.json();
      onProjectCreated(project);
      router.refresh();
    } catch (error) {
      // console.log({ user: session?.user });
      console.error('Error creating project:', error);
      toast.error('Project Creation Failed', {
        description:
          'There was a problem creating your project. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create new project</DialogTitle>
          <DialogDescription>
            Create a new project to organize your chats.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
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
                      className="resize-none"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icon (emoji)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="🦋"
                        {...field}
                        value={field.value || ''}
                      />
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
                    <FormLabel>Color</FormLabel>
                    <FormControl>
                      <div className="flex gap-2 items-center">
                        <Input
                          type="color"
                          className="size-10 p-1 cursor-pointer"
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

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
