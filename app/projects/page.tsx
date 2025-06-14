'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/projects');

      if (!response.ok) {
        console.log('Project fetch status:', response.status);
        throw new Error(`Failed to fetch projects: ${response.status}`);
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
    setIsSidebarOpen(true);
    setOpen(true);
  };
  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isSidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        // Check if the click originated from within the HeaderIsland to prevent immediate closure
        const headerIslandElement = document.querySelector(
          '.pointer-events-none.fixed.inset-x-0.top-0',
        );
        if (headerIslandElement?.contains(event.target as Node)) {
          // Check if the actual click target is the toggle button itself or its child icon
          // This is a bit of a heuristic. A more robust way would be to pass a ref for the toggle button.
          let targetElement = event.target as HTMLElement;
          let isToggleButton = false;
          while (targetElement && targetElement !== headerIslandElement) {
            if (targetElement.getAttribute('aria-label') === 'Toggle sidebar') {
              isToggleButton = true;
              break;
            }
            targetElement = targetElement.parentElement as HTMLElement;
          }
          if (isToggleButton) return; // Don't close if toggle button was clicked
        }
        setIsSidebarOpen(false);
      }
    };

    if (isSidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSidebarOpen]);

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
