import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FranchiseRecoveryPaymentsEditor } from './franchise-recovery-payments-editor';

let recovery = { managerCode: 'TALLER' };

vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }) => ({ data: queryKey[2] === 'franchise-recovery' ? recovery : [] }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  useMutation: () => ({ isPending: false, mutate: vi.fn() }),
}));
vi.mock('@/modules/cases/api/finance-api', () => ({ createFinancialMovement: vi.fn(), listFinancialMovements: vi.fn() }));
vi.mock('@/shared/api/http-client', () => ({ requestJson: vi.fn() }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/modules/cases/components/payments-editor-panel', () => ({ PaymentsEditorPanel: ({ caseDetail }) => <div data-testid="canonical-payments">{caseDetail.caseTypeCode}</div> }));
vi.mock('@/modules/cases/components/extra-budget-payments-panel', () => ({ ExtraBudgetPaymentsPanel: ({ caseTypeCode }) => <div data-testid="canonical-extras">{caseTypeCode}</div> }));

describe('FranchiseRecoveryPaymentsEditor', () => {
  it('reuses the Workshop payment and extra-work flow', () => {
    recovery = { managerCode: 'TALLER' };
    render(<FranchiseRecoveryPaymentsEditor caseId="7" caseDetail={{ caseTypeCode: 'RECUPERO_FRANQUICIA' }} />);
    expect(screen.getByTestId('canonical-payments')).toHaveTextContent('RECLAMO_TERCEROS');
    expect(screen.getByTestId('canonical-extras')).toHaveTextContent('RECLAMO_TERCEROS');
  });

  it('reuses the legal payment and extra-work flow for Abogado', () => {
    recovery = { managerCode: 'ABOGADO' };
    render(<FranchiseRecoveryPaymentsEditor caseId="7" caseDetail={{ caseTypeCode: 'RECUPERO_FRANQUICIA' }} />);
    expect(screen.getByTestId('canonical-payments')).toHaveTextContent('RECLAMO_TERCEROS_ABOGADO');
    expect(screen.getByTestId('canonical-extras')).toHaveTextContent('RECLAMO_TERCEROS_ABOGADO');
  });
});
