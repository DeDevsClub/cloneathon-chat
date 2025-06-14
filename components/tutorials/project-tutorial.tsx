import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  PlusCircle,
  Rocket,
  Sparkles,
  MessageSquare,
  Folder,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProjectTutorialProps {
  onDismiss: () => void;
  onCreateProject: () => void;
}

const steps = [
  {
    title: 'Welcome to your Workspace',
    description:
      "Let's get you started with your first project. Projects help you organize your AI chats and collaborate effectively.",
    icon: Sparkles,
    animation: 'pulse',
  },
  {
    title: 'Create Your Workspace',
    description:
      "Click the 'New Project' button to create your first project. You can give it a name, description, and even customize its icon and color.",
    icon: PlusCircle,
    animation: 'bounce',
    highlight: 'button',
  },
  {
    title: 'Organize Your Chats',
    description:
      'Projects help you group related conversations. Think of them like folders for your AI collaboration sessions.',
    icon: Folder,
    animation: 'float',
  },
  {
    title: 'Start Collaborating',
    description:
      'Once your project is set up, you can start new AI chat sessions that will be stored within your project.',
    icon: MessageSquare,
    animation: 'slide',
  },
  {
    title: 'Ready for Takeoff!',
    description:
      "You're all set! Create your first project now and elevate your AI collaboration experience.",
    icon: Rocket,
    animation: 'zoom',
  },
];

export function ProjectTutorial({
  onDismiss,
  onCreateProject,
}: ProjectTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    // Auto-advance if user hasn't interacted yet (only for first few steps)
    if (!hasInteracted && currentStep < 2) {
      const timer = setTimeout(() => {
        setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [currentStep, hasInteracted]);

  const handleNext = () => {
    if (!hasInteracted) setHasInteracted(true);

    if (currentStep === steps.length - 1) {
      handleCreateProject();
    } else {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handlePrevious = () => {
    if (!hasInteracted) setHasInteracted(true);
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => {
      setDismissed(true);
      onDismiss();
    }, 500);
  };

  const handleCreateProject = () => {
    setVisible(false);
    setTimeout(() => {
      setDismissed(true);
      onCreateProject();
    }, 300);
  };

  // Don't render if dismissed
  if (dismissed) return null;

  const currentStepData = steps[currentStep];
  const IconComponent = currentStepData.icon;

  // Animation variants for the tutorial card
  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', damping: 15 } },
    exit: { opacity: 0, y: -50, transition: { duration: 0.3 } },
  };

  // Animation variants for the step indicator dots
  const dotVariants = {
    inactive: { scale: 0.8, backgroundColor: 'rgba(255, 255, 255, 0.3)' },
    active: {
      scale: 1.2,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      boxShadow: '0 0 15px 5px rgba(157, 102, 255, 0.5)',
    },
  };

  // Animation for the icons based on the step's animation property
  const getIconAnimation = (animation: string) => {
    switch (animation) {
      case 'pulse':
        return {
          animate: {
            scale: [1, 1.1, 1],
            opacity: [0.8, 1, 0.8],
            transition: {
              repeat: Number.POSITIVE_INFINITY,
              duration: 2,
            },
          },
        };
      case 'bounce':
        return {
          animate: {
            y: [0, -10, 0],
            transition: {
              repeat: Number.POSITIVE_INFINITY,
              duration: 1.5,
            },
          },
        };
      case 'float':
        return {
          animate: {
            y: [0, -5, 0],
            x: [0, 3, 0],
            rotate: [0, 5, 0],
            transition: {
              repeat: Number.POSITIVE_INFINITY,
              duration: 3,
            },
          },
        };
      case 'slide':
        return {
          animate: {
            x: [0, 5, 0],
            transition: {
              repeat: Number.POSITIVE_INFINITY,
              duration: 2,
            },
          },
        };
      case 'zoom':
        return {
          animate: {
            scale: [1, 1.15, 1],
            rotate: [0, 5, 0],
            transition: {
              repeat: Number.POSITIVE_INFINITY,
              duration: 2.5,
            },
          },
        };
      default:
        return {};
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative w-full max-w-xl p-8 rounded-2xl overflow-hidden"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Background with synthwave grid effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 z-0">
              <div className="absolute inset-0 bg-grid-white/[0.05] bg-[length:50px_50px]" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/10 to-transparent" />
              <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-black/50 to-transparent" />
            </div>

            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 text-white/80 hover:text-white hover:bg-white/10 z-10"
              onClick={handleDismiss}
            >
              <X size={18} />
            </Button>

            <div className="relative z-10 text-white space-y-6">
              {/* Icon */}
              <motion.div
                className="size-16 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/30"
                {...getIconAnimation(currentStepData.animation)}
              >
                <IconComponent size={32} className="text-white" />
              </motion.div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-300">
                {currentStepData.title}
              </h3>

              {/* Description */}
              <p className="text-center text-white/80 max-w-md mx-auto">
                {currentStepData.description}
              </p>

              {/* Step indicators */}
              <div className="flex justify-center gap-2 pt-4">
                {steps.map((_, index) => (
                  <motion.div
                    key={index}
                    className={cn('w-2.5 h-2.5 rounded-full cursor-pointer')}
                    variants={dotVariants}
                    animate={currentStep === index ? 'active' : 'inactive'}
                    onClick={() => {
                      setHasInteracted(true);
                      setCurrentStep(index);
                    }}
                  />
                ))}
              </div>

              {/* Navigation buttons */}
              <div className="flex justify-between pt-6">
                <Button
                  variant="ghost"
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                  className="text-white/80 hover:text-white hover:bg-white/10"
                >
                  <ChevronLeft size={20} className="mr-2" />
                  Back
                </Button>

                <Button
                  onClick={handleNext}
                  className={cn(
                    'bg-gradient-to-r shadow-lg transition-all duration-300',
                    currentStep === steps.length - 1
                      ? 'from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-purple-500/20'
                      : 'from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-indigo-500/20',
                  )}
                >
                  {currentStep === steps.length - 1 ? (
                    <>
                      Create Project
                      <Rocket size={18} className="ml-2 animate-pulse" />
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight size={20} className="ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
