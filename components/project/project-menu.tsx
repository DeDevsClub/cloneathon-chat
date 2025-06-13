import { Dispatch, SetStateAction } from 'react';
import { useRouter } from 'next/navigation';
import { FolderEdit, Trash2 } from 'lucide-react'; // MoreHorizontal
import { toast } from 'sonner';
import { Project } from '@/lib/db/schema';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ProjectMenuProps {
  project: Project;
  open: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
}

export const ProjectMenu = ({
  project,
  open,
  onOpenChange,
}: ProjectMenuProps) => {
  const router = useRouter();

  const handleEdit = () => {
    router.push(`/projects/${project.id}/edit`);
    onOpenChange(false);
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete project');
      }

      toast.success('Project deleted successfully');
      router.refresh(); // Refresh to update the projects list
    } catch (error) {
      toast.error('Failed to delete project');
      console.error('Error deleting project:', error);
    } finally {
      onOpenChange(false);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <span className="sr-only">Open project menu</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleEdit}>
          <FolderEdit className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
          onClick={handleDelete}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
