import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FolderPlus } from 'lucide-react';
import { toast } from 'sonner';
import { Project } from '@/lib/db/schema';

import { Button } from '@/components/ui/button';
import { ProjectItem } from '@/components/project/project-item';
import { Separator } from '@/components/ui/separator';
import { CreateProjectDialog } from '@/components/project/create-project-dialog';

interface ProjectListProps {
  activeProjectId?: string;
  onProjectSelected?: (project: Project) => void;
  className?: string;
}

export const ProjectList = ({
  activeProjectId,
  onProjectSelected,
  className,
}: ProjectListProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // Fetch projects on component mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
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
        setIsLoading(false);
      }
    };
    
    fetchProjects();
  }, []);
  
  // Handle project creation success
  const handleProjectCreated = (newProject: Project) => {
    setProjects(prev => [newProject, ...prev]);
    setIsCreateDialogOpen(false);
    toast.success('Project created successfully!');
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium">Projects</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-7 w-7 p-0"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <FolderPlus className="h-4 w-4" />
          <span className="sr-only">Create project</span>
        </Button>
      </div>
      
      <Separator className="my-2" />
      
      {isLoading ? (
        <div className="py-2 text-sm text-muted-foreground">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="py-2 text-sm text-muted-foreground">
          No projects found. Create your first project to get started!
        </div>
      ) : (
        <div className="space-y-1 mt-2">
          {projects.map((project) => (
            <ProjectItem
              key={project.id}
              project={project}
              active={activeProjectId === project.id}
              onProjectSelected={onProjectSelected}
            />
          ))}
        </div>
      )}
      
      <CreateProjectDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onProjectCreated={handleProjectCreated}
      />
    </div>
  );
};
