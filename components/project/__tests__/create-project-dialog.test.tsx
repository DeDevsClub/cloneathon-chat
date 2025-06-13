import React from 'react';
import { jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateProjectDialog } from '../create-project-dialog';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { describe, it, expect, beforeEach } from '@jest/globals';

// Mock the modules
jest.mock('next/navigation');
jest.mock('next-auth/react');
jest.mock('sonner');

describe('CreateProjectDialog Component', () => {
  // Props for the component
  const mockProps = {
    open: true,
    onOpenChange: jest.fn(),
    onProjectCreated: jest.fn(),
  };

  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
    (useRouter as jest.Mock).mockImplementation(() => ({
      push: jest.fn(),
      refresh: jest.fn(),
    }));
    (useSession as jest.Mock).mockImplementation(() => ({
      data: {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
        },
      },
    }));
  });

  it('renders correctly when open', () => {
    render(<CreateProjectDialog {...mockProps} />);
    expect(screen.getByText('Create new project')).toMatchInlineSnapshot();
    expect(screen.getByLabelText('Name')).toMatchInlineSnapshot();
    expect(
      screen.getByLabelText('Description (optional)'),
    ).toMatchInlineSnapshot();
    expect(screen.getByLabelText('Icon (emoji)')).toMatchInlineSnapshot();
    expect(screen.getByLabelText('Color')).toMatchInlineSnapshot();
    expect(
      screen.getByRole('button', { name: 'Create' }),
    ).toMatchInlineSnapshot();
  });

  it('validates required fields', async () => {
    render(<CreateProjectDialog {...mockProps} />);

    // Submit without filling required fields
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    // Wait for validation errors
    await waitFor(() => {
      expect(
        screen.getByText('Project name is required'),
      ).toMatchInlineSnapshot();
    });
  });

  it('handles successful project creation', async () => {
    // Mock successful API response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      text: jest.fn().mockResolvedValueOnce(
        JSON.stringify({
          project: { id: 'new-project-id', name: 'Test Project' },
        }),
      ),
    });

    render(<CreateProjectDialog {...mockProps} />);

    // Fill out the form
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Test Project' },
    });
    fireEvent.change(screen.getByLabelText('Description (optional)'), {
      target: { value: 'Test Description' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    // Wait for the form submission to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/projects',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Test Project'),
        }),
      );
      expect(mockProps.onProjectCreated).toHaveBeenCalledWith({
        id: 'new-project-id',
        name: 'Test Project',
      });
    });
  });

  it('handles API errors correctly', async () => {
    // Mock API error response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: jest
        .fn()
        .mockResolvedValueOnce(JSON.stringify({ error: 'Server error' })),
    });

    render(<CreateProjectDialog {...mockProps} />);

    // Fill out the form
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Test Project' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    // Wait for error toast
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Project Creation Failed',
        expect.objectContaining({
          description: expect.stringMatching(
            /Server error|Failed to create project/,
          ),
        }),
      );
    });
  });

  it('redirects guest users to login when creating a project', async () => {
    // Mock guest session
    (useSession as jest.Mock).mockImplementation(() => ({
      data: {
        user: {
          id: 'guest-user-id',
          email: 'guest@example.com',
          type: 'guest',
        },
      },
    }));

    // Mock API error for unauthorized
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: jest
        .fn()
        .mockResolvedValueOnce(JSON.stringify({ error: 'Unauthorized' })),
    });

    const mockRouter = { push: jest.fn(), refresh: jest.fn() };
    (useRouter as jest.Mock).mockImplementation(() => mockRouter);

    render(<CreateProjectDialog {...mockProps} />);

    // Fill out and submit the form
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Test Project' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    // Wait for redirect
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Authentication Required',
        expect.objectContaining({
          description: expect.stringContaining('sign in'),
        }),
      );
      // Check that setTimeout was used to redirect (need to wait for the timer)
      expect(setTimeout).toHaveBeenCalled();
    });

    // Fast-forward timers to trigger the redirect
    jest.runAllTimers();
    expect(mockRouter.push).toHaveBeenCalledWith('/login');
  });
});
