import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FranchiseRecoveryEditor } from './franchise-recovery-editor';

const navigate = vi.fn();
let recovery = null;

vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));
vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }) => ({ data: queryKey[2] === 'franchise-recovery' ? recovery : { managerCodes: [], opinionCodes: [], paymentStatusCodes: [] } }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  useMutation: () => ({ isPending: false, mutate: vi.fn() }),
}));
vi.mock('@/shared/api/http-client', () => ({ requestJson: vi.fn() }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe('FranchiseRecoveryEditor associated folder', () => {
  beforeEach(() => {
    navigate.mockReset();
    recovery = null;
  });

  it('shows a clearly labeled navigation action for an associated folder', async () => {
    const user = userEvent.setup();
    recovery = { id: 7, baseCaseId: 42, baseFolderCode: 'CAR-042' };
    render(<FranchiseRecoveryEditor caseId="7" caseDetail={{}} />);

    await user.click(screen.getByRole('button', { name: 'Abrir carpeta asociada CAR-042' }));
    expect(navigate).toHaveBeenCalledWith('/cases/42');
  });

  it('explains when there is no associated folder and does not offer navigation', () => {
    render(<FranchiseRecoveryEditor caseId="7" caseDetail={{}} />);

    expect(screen.getByText('Sin carpeta asociada.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /abrir carpeta asociada/i })).not.toBeInTheDocument();
  });
});
