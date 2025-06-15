'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Sparkles, ArrowRight, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';

import { ProjectItem } from '@/components/project/project-item';
import { CreateProjectDialog } from '@/components/project/create-project-dialog';

const HomePage = () => {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { data: session, status } = useSession();
  const sessionLoading = status === 'loading';

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/projects');
      if (!response.ok) {
        console.log({ response });
        throw new Error('Failed to fetch projects');
      }

      const data = await response.json();
      console.log({ data });
      setProjects(data.projects || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleProjectCreated = (project: any) => {
    // Refresh the project list after a new project is created
    fetchProjects();
    setOpen(false);
    toast.success('Project created successfully');
  };

  const handleCreateProject = () => {
    if (!session) {
      toast.error('Please log in to create a project');
      router.push('/login');
      return;
    }
    setOpen(true);
  };

  return (
    <div className="container py-8 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between mb-8"
      >
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-purple-500">
          Projects
        </h1>
        <Button
          onClick={handleCreateProject}
          className="bg-purple-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-purple-500/20 transition-all duration-300"
          size="lg"
          disabled={sessionLoading}
        >
          <Plus className="size-4 mr-2 text-white" />
          <span className="text-white">New Project</span>
        </Button>
      </motion.div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="size-12 animate-spin text-purple-500 mb-4" />
          <p className="text-lg text-muted-foreground animate-pulse">
            Loading your projects...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="col-span-full py-16 flex flex-col items-center justify-center bg-gradient-to-br from-muted to-muted dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 rounded-2xl border border-muted-foreground/50 shadow-xl overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(to_bottom,transparent,black,transparent)] pointer-events-none" />
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: 'reverse',
                  duration: 3,
                }}
                className="mb-6"
              >
                <Sparkles className="size-20 text-purple-400" />
              </motion.div>
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-purple-400 mb-4 dark:text-white">
                Create Projects
              </h2>
              <p className="text-lg text-center text-primary max-w-lg mb-8 px-6 dark:text-gray-600">
                Create your first project to organize your chats. Experience the
                power of AI-assisted collaboration.
              </p>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={handleCreateProject}
                  className="bg-purple-700 hover:bg-purple-600 px-8 h-auto text-lg shadow-xl shadow-purple-500/20 transition-all duration-300 group"
                  variant="outline"
                  disabled={sessionLoading}
                >
                  {!session ? (
                    <>
                      <LogIn className="size-5 mr-2 group-hover:rotate-12 transition-transform duration-300 text-white" />
                      <span className="text-white">Sign In to Create</span>
                    </>
                  ) : (
                    <>
                      <span className="text-white">Create Project</span>
                      <ArrowRight className="ml-2 size-5 group-hover:translate-x-1 transition-transform duration-300 text-white" />
                    </>
                  )}
                </Button>
              </motion.div>
            </motion.div>
          ) : (
            projects.map((project) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <ProjectItem
                  project={project}
                  onProjectSelected={() =>
                    router.push(`/projects/${project.id}`)
                  }
                />
              </motion.div>
            ))
          )}
        </div>
      )}

      <CreateProjectDialog
        open={open}
        onOpenChange={setOpen}
        onProjectCreated={handleProjectCreated}
      />

      {/* Background grid for synthwave effect */}
      <div className="fixed inset-0 -z-10 size-full bg-grid-white/[0.02] pointer-events-none" />
    </div>
  );
};

export default HomePage;
