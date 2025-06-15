'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Chat } from '@/lib/db/schema';

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
import { useSession } from 'next-auth/react';

// Form validation schema
const formSchema = z.object({
  name: z
    .string()
    .min(1, 'Chat name is required')
    .max(255, 'Chat name is too long'),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChatCreated: (chat: Chat) => void;
}

export function CreateChatDialog({
  open,
  onOpenChange,
  onChatCreated,
}: CreateChatDialogProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: session } = useSession();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
    },
  });

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    const isGuest = session?.user?.type === 'guest';
    try {
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const error = await response.json();
        if (isGuest) {
          toast.error('Authentication Required', {
            description:
              'Please sign in with your account to create and manage chats.',
            action: {
              label: 'Sign In',
              onClick: () => router.push('/login'),
            },
            duration: 5000,
          });
          setTimeout(() => router.push('/login'), 2000);
          return;
        }
        throw new Error(error.message || 'Failed to create chat');
      }

      const { chat } = await response.json();
      onChatCreated(chat);
      router.refresh();
    } catch (error) {
      console.error('Error creating chat:', error);
      toast.error('Chat Creation Failed', {
        description:
          'There was a problem creating your chat. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Chat</DialogTitle>
          <DialogDescription>
            Create a new chat for your next conversation.
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
                    <Input placeholder="My Chat" {...field} autoFocus />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
