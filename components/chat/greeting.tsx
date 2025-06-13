import { motion } from 'framer-motion';

export const Greeting = () => {
  // Random synthwave phrases for dynamic greetings
  const greetings = [
    { main: 'WELCOME TO THE FUTURE', sub: 'Your AI companion awaits...' },
    {
      main: 'NEURAL LINK ESTABLISHED',
      sub: "Let's create something extraordinary!",
    },
    { main: 'SYSTEM ONLINE', sub: 'Ready to hack the impossible?' },
    { main: 'SYNTHWAVE ACTIVATED', sub: 'Your digital journey begins now' },
    { main: 'ENTER THE GRID', sub: 'How can we revolutionize today?' },
  ];

  // Select a random greeting
  const greeting = greetings[Math.floor(Math.random() * greetings.length)];

  return (
    <div
      key="overview"
      className="relative max-w-7xl h-[calc(100vh-4rem)] mx-auto px-4 size-full flex flex-col justify-center overflow-hidden"
    >
      {/* Synthwave grid background */}
      <div className="absolute inset-0 z-0 opacity-10 dark:opacity-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-600/20 to-transparent" />
        <div
          className="size-full"
          style={{
            backgroundImage: `linear-gradient(0deg, transparent 24%, rgba(139, 92, 246, .3) 25%, rgba(139, 92, 246, .3) 26%, transparent 27%, transparent 74%, rgba(139, 92, 246, .3) 75%, rgba(139, 92, 246, .3) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(139, 92, 246, .3) 25%, rgba(139, 92, 246, .3) 26%, transparent 27%, transparent 74%, rgba(139, 92, 246, .3) 75%, rgba(139, 92, 246, .3) 76%, transparent 77%, transparent)`,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      {/* Glow elements */}
      <div className="absolute -bottom-40 -left-40 size-80 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
      <div className="absolute -bottom-40 -right-40 size-80 bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
      <div className="absolute top-40 left-20 size-80 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />

      <div className="relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 100, delay: 0.2 }}
          className="text-5xl md:text-6xl font-bold tracking-tighter mb-4"
        >
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-gradient">
            {greeting.main}
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ type: 'spring', stiffness: 50, delay: 0.6 }}
          className="text-2xl md:text-3xl my-6 text-zinc-400 dark:text-zinc-300"
        >
          {greeting.sub}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ delay: 1.2 }}
          className="mt-8 flex flex-row gap-2 items-center"
        >
          <div className="size-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm text-zinc-500 dark:text-zinc-400 animate-pulse">
            AI systems ready for interaction
          </span>
        </motion.div>
      </div>
    </div>
  );
};
