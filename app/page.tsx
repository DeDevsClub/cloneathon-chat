'use client';

import { Button } from '@/components/ui/button'; // Assuming Shadcn Button
import {
  ArrowRight,
  MessageCircle,
  Zap,
  BrainCircuit,
  ShieldCheck,
  Palette,
} from 'lucide-react'; // Example icons
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  return (
    <main className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col items-center overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative w-full h-dvh flex flex-col items-center justify-center text-center p-4 overflow-hidden rounded-xl bg-slate-950">
        {/* Subtle Animated Gradient Background - Placeholder for actual animation */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-full h-full bg-violet-600/80 opacity-30 animate-pulse-medium blur-3xl" />
          <div className="absolute top-0 right-0 w-full h-full bg-violet-800/80 opacity-30 animate-pulse-slow blur-3xl" />
          <div className="absolute middle-0 w-full h-full bg-violet-600/80 opacity-30 animate-pulse-medium blur-3xl" />
          <div className="absolute bottom-0 right-0 w-full h-full bg-slate-400 opacity-30 animate-pulse-fast blur-3xl" />
          <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-slate-800/80 opacity-20 animate-pulse-medium blur-3xl" />
        </div>
        <div className="z-10 grid grid-cols-1 items-center justify-between w-fit h-fit bg-slate-950/60 font-bold text-slate-100 rounded-xl border-2 border-slate-100">
          <div className="flex flex-row items-center justify-center gap-3 md:gap-4 text-xl md:text-2xl text-slate-100 w-full rounded-t-lg bg-slate-950/80 p-6">
            <MessageCircle className="size-6 md:size-8 text-slate-100 animate-bounce-slow" />
            Chat. Reimagined.
          </div>

          <div className="w-full flex bg-slate-950 px-2 py-2 rounded-b-lg">
            <Button
              variant="default"
              size="lg"
              className={cn(
                'w-full flex justify-center items-center text-md md:text-lg p-2',
              )}
              onClick={() => router.push('/chats')}
            >
              Launch App <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
        <div className="absolute bottom-8 text-xs text-[#8B949E] z-10">
          Scroll down to explore
        </div>
      </section>

      {/* Features Section - Placeholder */}
      <section id="features" className="w-full py-20 px-4 bg-slate-950 z-10">
        <div className="container mx-auto text-center">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature Card Example */}
            {[
              {
                icon: <Zap size={36} className="text-slate-100" />,
                title: 'Real-time Sync',
                description:
                  'Instant message delivery and synchronization across all your devices.',
              },
              {
                icon: <BrainCircuit size={36} className="text-slate-100" />,
                title: 'AI-Powered Assistance',
                description:
                  'Smart replies, summaries, and content generation at your fingertips.',
              },
              {
                icon: <ShieldCheck size={36} className="text-slate-100" />,
                title: 'Secure & Private',
                description:
                  'End-to-end encryption options and robust privacy controls.',
              },
              {
                icon: <Palette size={36} className="text-slate-100" />,
                title: 'Dynamic Themes',
                description:
                  'Personalize your chat interface with stunning, customizable themes.',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-slate-950 backdrop-blur-md p-8 rounded-xl shadow-lg border border-white/10 transform hover:scale-105 transition-transform duration-300"
              >
                <div className="mb-4 flex justify-center">{feature.icon}</div>
                <h3 className="text-2xl font-semibold mb-3 text-white">
                  {feature.title}
                </h3>
                <p className="text-slate-100">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TODO: Interactive Showcase Section */}
      {/* TODO: Secondary CTA Section */}
      {/* TODO: Footer Section */}

      {/* Basic Footer Placeholder */}
      <footer
        className="w-full text-center border-t-2 q
          transition-transform duration-300 hover:-translate-y-2 transform hover:text-slate-800 dark:hover:text-slate-200
        border-slate-100 dark:border-slate-700 bg-slate-950 dark:bg-slate-900 rounded-t-xl
        dark:text-slate-950 text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-950
        "
      >
        <p
          className="
            text-xs hover:text-xs font-semibold p-4 shadow-lg bg-clip-text"
        >
          pown3d by DeDevsClub
        </p>
      </footer>
    </main>
  );
}
