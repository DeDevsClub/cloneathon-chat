import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Project } from '@/lib/db/schema';
import { FolderIcon, MoreHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ProjectMenu } from '@/components/project/project-menu';

interface ProjectItemProps {
  project: Project;
  active?: boolean;
  showMenu?: boolean;
  onProjectSelected?: (project: Project) => void;
}

export const ProjectItem = ({
  project,
  active = false,
  showMenu = true,
  onProjectSelected,
}: ProjectItemProps) => {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  
  const handleClick = () => {
    if (onProjectSelected) {
      onProjectSelected(project);
    } else {
      router.push(`/projects/${project.id}`);
    }
  };

  return (
    <div
      className={cn(
        'group flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted/50',
        active && 'bg-muted font-medium'
      )}
    >
      <Button
        variant="ghost"
        className="flex w-full items-center justify-start gap-2 px-2 hover:bg-transparent"
        onClick={handleClick}
      >
        <div
          className="flex h-5 w-5 items-center justify-center rounded-md"
          style={{ backgroundColor: project.color || '#4f46e5' }}
        >
          {project.icon ? (
            <span className="text-xs text-white">{project.icon}</span>
          ) : (
            <FolderIcon className="h-3.5 w-3.5 text-white" />
          )}
        </div>
        <span className="truncate">{project.name}</span>
      </Button>

      {showMenu && (
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(true);
            }}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
          <ProjectMenu 
            project={project} 
            open={menuOpen} 
            onOpenChange={setMenuOpen} 
          />
        </div>
      )}
    </div>
  );
};
