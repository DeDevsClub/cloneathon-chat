'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { useObjectState } from '@/hooks/use-object-state';
import { Icon } from '@iconify/react';
import { toast } from 'sonner';
import { signIn } from 'next-auth/react';
import { Loader, Lock, Mail, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useObjectState({
    email: '',
    password: '',
  });
  const [mounted, setMounted] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Animation delay mount effect
  useEffect(() => {
    setMounted(true);
  }, []);

  const emailAndPasswordSignIn = async () => {
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      const res = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (res?.error) {
        // Check for specific error types to provide more helpful feedback
        if (
          res.error.includes('password') ||
          res.error.toLowerCase().includes('credentials')
        ) {
          toast.error('Authentication Failed', {
            description:
              'The password you entered is incorrect. Please try again.',
            action: {
              label: 'Retry',
              onClick: () => {
                // Focus the password field for easier retry
                document.getElementById('password')?.focus();
                // Clear the password field
                setFormData((prev) => ({ ...prev, password: '' }));
              },
            },
            duration: 5000,
          });
        } else {
          toast.error('Sign In Failed', {
            description:
              res.error || 'Unable to sign in with these credentials',
          });
        }
        return;
      }

      if (res?.ok) {
        toast.success('Signed in successfully!');
        router.push('/');
        router.refresh();
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 md:p-8 bg-gradient-to-br from-background via-background to-accent/10 overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-48 -left-48 size-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-48 -right-48 size-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Logo or branding mark */}
      <motion.div
        className="mb-8 text-3xl font-bold text-primary"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 10 }}
      >
        <div className="flex items-center gap-2">
          <Icon icon="mdi:chat" className="text-primary" />
          <span>th3.chat</span>
        </div>
      </motion.div>

      <motion.div
        initial="hidden"
        animate={mounted ? 'visible' : 'hidden'}
        variants={containerVariants}
        className="w-full md:max-w-md"
      >
        <Card className="backdrop-blur-sm bg-background/75 border border-accent/20 shadow-lg">
          <CardHeader className="space-y-1 pb-2">
            <motion.div variants={itemVariants}>
              <CardTitle className="text-2xl font-bold text-center text-foreground/90">
                Welcome back
              </CardTitle>
            </motion.div>
            <motion.div variants={itemVariants}>
              <CardDescription className="text-center text-muted-foreground">
                Enter your credentials to access your account
              </CardDescription>
            </motion.div>
          </CardHeader>

          <CardContent className="space-y-6 pt-4">
            <motion.div variants={itemVariants} className="space-y-4">
              <div className="relative">
                <Label
                  htmlFor="email"
                  className={`transition-all ${focusedField === 'email' || formData.email ? 'text-xs text-primary' : ''}`}
                >
                  Email
                </Label>
                <div className="mt-1 relative rounded-md">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail
                      className={`size-5 ${focusedField === 'email' ? 'text-primary' : 'text-muted-foreground/60'} transition-colors`}
                    />
                  </div>
                  <Input
                    id="email"
                    autoFocus
                    className={`pl-10 ${focusedField === 'email' ? 'border-primary ring-1 ring-primary' : ''} transition-all`}
                    disabled={loading}
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    type="email"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div className="relative">
                <Label
                  htmlFor="password"
                  className={`transition-all ${focusedField === 'password' || formData.password ? 'text-xs text-primary' : ''}`}
                >
                  Password
                </Label>
                <div className="mt-1 relative rounded-md">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock
                      className={`size-5 ${focusedField === 'password' ? 'text-primary' : 'text-muted-foreground/60'} transition-colors`}
                    />
                  </div>
                  <Input
                    id="password"
                    className={`pl-10 ${focusedField === 'password' ? 'border-primary ring-1 ring-primary' : ''} transition-all`}
                    disabled={loading}
                    value={formData.password}
                    placeholder="••••••••"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        emailAndPasswordSignIn();
                      }
                    }}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    type="password"
                    required
                  />
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Button
                className="w-full relative overflow-hidden group bg-primary hover:bg-primary/90 text-white dark:bg-accent dark:hover:bg-accent/90 dark:hover:text-secondary"
                onClick={emailAndPasswordSignIn}
                disabled={loading}
              >
                <span className="relative z-10 flex items-center gap-2">
                  {loading ? (
                    <Loader className="size-4 animate-spin" />
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </span>
                <span className="absolute inset-0 bg-gradient-to-r from-primary/50 to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </Button>
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
                    <Link
                      href="/signup"
                      className="text-primary hover:text-primary/90 hover:underline"
                    >
                      Create Account
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
