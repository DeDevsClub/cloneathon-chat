'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useActionState,
  useEffect,
  Dispatch,
  SetStateAction,
  useState,
} from 'react';
import { motion } from 'framer-motion';
import { Check, MessageSquare, Zap, Sparkles, Code, Lock } from 'lucide-react';
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
import Image from 'next/image';
import { signup, type RegisterActionState } from '../actions';
import { toast } from '@/components/toast';
import { useSession } from 'next-auth/react';
import { GridBeam } from '@/components/grid-beam';

export default function Page() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [mounted, setMounted] = useState(false);

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
      toast({ type: 'error', description: 'Account already exists!' });
    } else if (state.status === 'failed') {
      toast({ type: 'error', description: 'Failed to create account!' });
    } else if (state.status === 'invalid_data') {
      toast({
        type: 'error',
        description: 'Failed validating your submission!',
      });
    } else if (state.status === 'success') {
      toast({ type: 'success', description: 'Account created successfully!' });

      setIsSuccessful(true);
      updateSession();
      // Redirect to home page after successful account creation
      setTimeout(() => {
        router.push('/');
      }, 1000); // Short delay to allow the success message to be seen
    }
  }, [state, updateSession, router]);

  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get('email') as string);
    formAction(formData);
  };

  return (
    <div className="min-h-screen min-w-screen flex justify-center items-center bg-slate-600 backdrop-blur-sm overflow-hidden">
      {/* Right side: Sign up form */}
      <GridBeam className="flex items-start justify-start">
        <div className="relative z-10 w-full flex flex-col justify-center items-center">
          <motion.div
            initial="hidden"
            animate={mounted ? 'visible' : 'hidden'}
            variants={containerVariants}
            className="w-full max-w-md"
          >
            <Card className="bg-slate-900/90 backdrop-blur-sm border border-blue-500/30 shadow-[0_0_30px_rgba(168,85,247,0.25)] overflow-hidden">
              {/* Synthwave sun effect behind the card */}
              <div className="absolute -translate-x-1/2 w-64 h-64 bg-slate-600 rounded-full blur-3xl opacity-20" />

              <CardHeader className="space-y-1 pb-2 relative z-10">
                <motion.div variants={itemVariants}>
                  <div className="relative">
                    <CardTitle className="text-3xl font-bold text-center bg-clip-text text-transparent bg-blue-300">
                      Join the Future
                    </CardTitle>
                  </div>
                </motion.div>
                <motion.div variants={itemVariants}>
                  <div className="relative">
                    <CardDescription className="text-center text-blue-200/70">
                      Create your account to get started with AI-powered chat
                    </CardDescription>
                  </div>
                </motion.div>
              </CardHeader>

              <CardContent className="space-y-4 pt-4 relative z-10">
                <motion.div variants={itemVariants}>
                  <div className="space-y-2 relative">
                    <AuthForm action={handleSubmit}>
                      {/* Form styling handled by AuthForm component */}
                      <div className="pt-4">
                        <SubmitButton
                          isSuccessful={isSuccessful}
                          className="w-full relative overflow-hidden group bg-blue-500 hover:bg-blue-700 hover:to-blue-600 text-white font-bold py-3 rounded-lg transition-all duration-300 shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                        >
                          {isSuccessful ? (
                            <>
                              <Check className="size-5 mr-2" />
                              Success!
                            </>
                          ) : (
                            <>
                              <span className="mr-2">✨</span>
                              Join DeDevsClub
                            </>
                          )}
                        </SubmitButton>
                      </div>
                    </AuthForm>
                  </div>
                </motion.div>
              </CardContent>

              <CardFooter className="flex flex-col space-y-4 pt-0 relative z-10">
                <motion.div
                  variants={itemVariants}
                  className="text-center w-full"
                >
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-blue-500/30" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="bg-slate-900/80 px-3 py-1 rounded-full text-blue-200/80">
                        Already joined?{' '}
                        <Link
                          href="/login"
                          className="text-slate-400 hover:text-slate-300 hover:underline font-semibold transition-colors"
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
      </GridBeam>
    </div>
  );
}

// 'use client'

// export const Account: React.FC<{
//   defaultTab?: 0 | 1
//   firstTab: React.ReactNode
//   secondTab: React.ReactNode
// }> = ({ defaultTab = 0, firstTab, secondTab }) => {
//   const [currentTab, setCurrentTab] = useState<0 | 1>(defaultTab)

//   return (
//     <div className="flex w-full max-w-[430px] flex-col gap-2">
//       <Switch currentTab={currentTab} setTab={setCurrentTab} />
//       <div className="overflow-hidden rounded-xl border border-neutral-200 p-2 shadow-sm dark:border-neutral-900">
//         {currentTab === 0 && firstTab}
//         {currentTab === 1 && secondTab}
//       </div>
//     </div>
//   )
// }

// const Switch: React.FC<{
//   setTab: Dispatch<SetStateAction<0 | 1>>
//   currentTab: number
// }> = ({ setTab, currentTab }) => (
//   <div
//     className={`relative flex w-full items-center rounded-lg bg-neutral-100 py-1 text-neutral-900 dark:bg-neutral-800 dark:text-white`}>
//     <motion.div
//       transition={{ type: 'keyframes', duration: 0.15, ease: 'easeInOut' }}
//       animate={currentTab === 0 ? { x: 4 } : { x: '98%' }}
//       initial={currentTab === 0 ? { x: 4 } : { x: '98%' }}
//       className={`absolute h-5/6 w-1/2 rounded-md bg-white shadow-sm dark:bg-neutral-950`}
//     />
//     <button
//       onClick={() => {
//         setTab(0)
//       }}
//       className="z-10 h-9 w-full rounded-md text-center">
//       Sign in
//     </button>
//     <button
//       onClick={() => {
//         setTab(1)
//       }}
//       className="z-10 h-9 w-full rounded-md text-center">
//       Sign up
//     </button>
//   </div>
// )
