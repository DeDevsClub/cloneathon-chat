import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProjectsPage from '../page';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

// Mock modules
jest.mock('next-auth/react');
jest.mock('sonner');
jest.mock('@/hooks/use-projects', () => ({
  useProjects: jest.fn(() => ({ 
    projects: [], 
    isLoading: false, 
    error: null,
    fetchProjects: jest.fn()
  }))
}));

jest.mock('@/components/tutorials/project-tutorial', () => ({
  ProjectTutorial: () => <div data-testid="project-tutorial">Project Tutorial</div>
}));

describe('ProjectsPage Integration', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
    
    // Default to authenticated user
    (useSession as jest.Mock).mockImplementation(() => ({
      data: {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          type: 'user',
        },
      },
      status: 'authenticated',
    }));
  });

  it('renders the project page with create button', async () => {
    render(<ProjectsPage />);
    
    // Check page content
    expect(screen.getByText('Projects')).toBeInTheDocument();
    
    // Check create button exists
    const createButton = screen.getByRole('button', { name: /new project/i });
    expect(createButton).toBeInTheDocument();
  });

  it('opens create project dialog when create button is clicked', async () => {
    render(<ProjectsPage />);
    
    // Click the create button
    const createButton = screen.getByRole('button', { name: /new project/i });
    fireEvent.click(createButton);
    
    // Check if dialog is opened
    await waitFor(() => {
      expect(screen.getByText('Create new project')).toBeInTheDocument();
    });
  });

  it('successfully creates a project when form is submitted', async () => {
    // Mock successful API response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      text: jest.fn().mockResolvedValueOnce(JSON.stringify({ project: { id: 'new-project-id', name: 'Integration Test Project' } })),
    });

    render(<ProjectsPage />);
    
    // Click the create button to open dialog
    const createButton = screen.getByRole('button', { name: /new project/i });
    fireEvent.click(createButton);
    
    // Wait for dialog to appear
    await waitFor(() => {
      expect(screen.getByText('Create new project')).toBeInTheDocument();
    });
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText('Name'), { 
      target: { value: 'Integration Test Project' } 
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    
    // Wait for toast notification
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('Project created'),
        expect.anything()
      );
    });
  });

  it('shows tutorial for first time users with no projects', async () => {
    // Import the real hook for this test
    jest.resetModules();
    jest.mock('@/hooks/use-projects', () => ({
      useProjects: jest.fn(() => ({ 
        projects: [], 
        isLoading: false, 
        error: null,
        fetchProjects: jest.fn()
      }))
    }));
    
    render(<ProjectsPage />);
    
    // Check if tutorial is shown
    expect(screen.getByTestId('project-tutorial')).toBeInTheDocument();
  });
});
