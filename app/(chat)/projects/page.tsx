'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useLocalStorage } from '@/hooks/use-local-storage';

import { ProjectItem } from '@/components/project/project-item';
import { CreateProjectDialog } from '@/components/project/create-project-dialog';
import { ProjectTutorial } from '@/components/tutorials/project-tutorial';

const ProjectsPage = () => {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [hasSeenTutorial, setHasSeenTutorial] = useLocalStorage(
    'has-seen-projects-tutorial',
    false,
  );

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/projects');

      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }

      const data = await response.json();
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

    // Show tutorial if this is the first time visiting projects page
    if (!hasSeenTutorial) {
      // Small delay to allow projects to load first
      const timer = setTimeout(() => {
        setShowTutorial(true);
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [hasSeenTutorial]);

  const handleProjectCreated = (project: any) => {
    // Refresh the project list after a new project is created
    fetchProjects();
    setOpen(false);
    toast.success('Project created successfully');
  };

  const handleDismissTutorial = () => {
    setShowTutorial(false);
    setHasSeenTutorial(true);
  };

  const handleCreateFromTutorial = () => {
    setShowTutorial(false);
    setHasSeenTutorial(true);
    setOpen(true);
  };

  return (
    <div className="container py-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Projects</h1>
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4 mr-2" />
          New Project
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.length === 0 ? (
            <div className="col-span-full py-10 text-center">
              <p className="text-muted-foreground">
                No projects found. Create your first project to get started!
              </p>
            </div>
          ) : (
            projects.map((project) => (
              <ProjectItem
                key={project.id}
                project={project}
                onProjectSelected={() => router.push(`/projects/${project.id}`)}
              />
            ))
          )}
        </div>
      )}

      <CreateProjectDialog
        open={open}
        onOpenChange={setOpen}
        onProjectCreated={handleProjectCreated}
      />

      {/* Interactive tutorial */}
      {showTutorial && (
        <ProjectTutorial
          onDismiss={handleDismissTutorial}
          onCreateProject={handleCreateFromTutorial}
        />
      )}
    </div>
  );
};

export default ProjectsPage;
