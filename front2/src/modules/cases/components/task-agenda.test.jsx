import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TaskAgenda } from './task-agenda';
import { requestJson } from '@/shared/api/http-client';

let taskPage = { items: [] };

vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }) => ({ data: queryKey[0] === 'tasks' ? taskPage : { items: [] } }),
  useMutation: ({ mutationFn }) => ({ isPending: false, mutate: mutationFn }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));
vi.mock('@/shared/api/http-client', () => ({ requestJson: vi.fn() }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe('TaskAgenda', () => {
  beforeEach(() => {
    taskPage = { items: [] };
    requestJson.mockReset();
  });

  it('renders the backend items page without falling back to a duplicate content collection', () => {
    taskPage = {
      items: [{ id: 10, title: 'Tarea de recupero', resolved: false, dueDate: null }],
      content: [{ id: 11, title: 'No debe duplicarse', resolved: false, dueDate: null }],
    };

    render(<TaskAgenda caseId="100" organizationId={1} branchId={1} />);

    expect(screen.getByText('Tarea de recupero')).toBeInTheDocument();
    expect(screen.queryByText('No debe duplicarse')).not.toBeInTheDocument();
  });

  it('supports content as a compatibility fallback', () => {
    taskPage = { content: [{ id: 12, title: 'Tarea compatible', resolved: false, dueDate: null }] };

    render(<TaskAgenda caseId="100" organizationId={1} branchId={1} />);

    expect(screen.getByText('Tarea compatible')).toBeInTheDocument();
  });

  it('requires confirmation before deleting a task through the reusable API', async () => {
    const user = userEvent.setup();
    taskPage = { items: [{ id: 10, title: 'Tarea de recupero', resolved: false, dueDate: null }] };
    render(<TaskAgenda caseId="100" organizationId={1} branchId={1} />);

    await user.click(screen.getByRole('button', { name: 'Eliminar tarea Tarea de recupero' }));
    expect(screen.getByRole('dialog', { name: '¿Eliminar tarea?' })).toBeInTheDocument();
    expect(requestJson).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Eliminar' }));
    expect(requestJson).toHaveBeenCalledWith('/tasks/10', { method: 'DELETE' });
  });
});
