'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useTransition, useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Icon } from '@iconify/react';
import { AuthForm } from '@/components/auth-form';
import { SubmitButton } from '@/components/submit-button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { signup, type RegisterActionState } from '../actions';
import { toast } from '@/components/toast';
import { useSession } from 'next-auth/react';

export default function Page() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [state, formAction] = useActionState<RegisterActionState, FormData>(
    signup,
    {
      status: 'idle',
    },
  );

  const { update: updateSession } = useSession();

  // Animation delay mount effect
  useEffect(() => {
    setMounted(true);
  }, []);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 300, damping: 24 },
    },
  };

  useEffect(() => {
    if (state.status === 'user_exists') {
      toast({ type: 'error', description: 'Account already exists' });
      router.push('/login');
    } else if (state.status === 'failed') {
      toast({ type: 'error', description: 'Failed to create account' });
    } else if (state.status === 'invalid_data') {
      toast({
        type: 'error',
        description: 'Failed validating your submission',
      });
    } else if (state.status === 'success') {
      setIsSuccessful(true);
      updateSession();
      router.push('/chats');
      toast({ type: 'success', description: 'Account created successfully' });
    }
  }, [
    state,
    updateSession,
    router,
    startTransition,
    isSuccessful,
    setIsSuccessful,
  ]);

  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get('email') as string);
    formAction(formData);
    setIsSuccessful(true);
    updateSession();
    router.push('/chats');
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 md:p-8 bg-gradient-to-br from-background via-background to-primary/5 overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-48 -right-48 size-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute -bottom-48 -left-48 size-96 bg-accent/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: '8s' }}
        />
      </div>

      {/* Logo or branding mark */}
      {/* <motion.div
        className="mb-8 text-3xl font-bold text-primary"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 10 }}
      >
        <div className="flex items-center gap-2">
          <Icon icon="mdi:chat" className="text-primary" />
          <span>th3.chat</span>
        </div>
      </motion.div> */}

      <motion.div
        initial="hidden"
        animate={mounted ? 'visible' : 'hidden'}
        variants={containerVariants}
        className="w-full md:max-w-md"
      >
        <Card className="backdrop-blur-sm bg-background/75 border border-accent/20 shadow-lg">
          {/* Logo or branding mark */}
          <motion.div
            className="mb-8 text-3xl font-bold text-primary"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
          >
            <div className="flex justify-center items-center gap-2">
              <Icon icon="mdi:chat" className="text-primary" />
              <span>th3.chat</span>
            </div>
          </motion.div>
          <CardHeader className="space-y-1 pb-2">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            >
              <CardTitle className="flex items-center gap-2 justify-center text-2xl md:text-3xl font-bold text-center text-foreground/90">
                Create Account
              </CardTitle>
            </motion.div>
            <motion.div variants={itemVariants}>
              <CardDescription className="text-center text-muted-foreground w-full">
                Create your account to get started with th3.chat
              </CardDescription>
            </motion.div>
          </CardHeader>

          <CardContent className="space-y-4 pt-4">
            <motion.div variants={itemVariants}>
              <div className="space-y-2 relative">
                <AuthForm action={handleSubmit}>
                  {/* We can't style the form directly, but we'll style the container */}
                  <div className="pt-4">
                    <SubmitButton
                      isSuccessful={isSuccessful}
                      className="w-full relative overflow-hidden group bg-primary hover:bg-primary/90 text-white dark:bg-accent dark:hover:bg-accent/90 dark:hover:text-primary"
                    >
                      {isSuccessful ? (
                        <>
                          <Check className="size-4 mr-1" />
                          Success!
                        </>
                      ) : (
                        <>Join th3.chat</>
                      )}
                    </SubmitButton>
                  </div>
                </AuthForm>
              </div>
            </motion.div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 pt-0">
            <motion.div variants={itemVariants} className="text-center w-full">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-accent/30" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background/95 px-2 text-muted-foreground">
                    Already joined?{' '}
                    <Link
                      href="/login"
                      className="hover:underline cursor-pointer font-semibold text-md"
                    >
                      Login
                    </Link>
                  </span>
                </div>
              </div>
            </motion.div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
