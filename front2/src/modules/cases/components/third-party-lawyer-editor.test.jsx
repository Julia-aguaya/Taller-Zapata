import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThirdPartyLawyerEditor } from './third-party-lawyer-editor';

const saveLegalCase = vi.fn().mockResolvedValue({});
let legalCase = null;

vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }) => ({ data: queryKey.at(-1) === 'legal' ? legalCase : queryKey.at(-1) === 'catalogs' ? { legalProcessorCodes: [], legalClaimantCodes: [], legalInstanceCodes: [{ code: 'ADMINISTRATIVA', name: 'Administrativa' }, { code: 'JUDICIAL', name: 'Judicial' }], legalClosureReasonCodes: [], legalExpensePayerCodes: [] } : [] }),
  useMutation: ({ mutationFn, onSuccess }) => ({ isPending: false, mutate: async () => onSuccess?.(await mutationFn()) }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));
vi.mock('@/modules/cases/api/third-party-api', () => ({
  getLegalCase: vi.fn(), saveLegalCase: (...args) => saveLegalCase(...args), getCasePersons: vi.fn(), getLegalNews: vi.fn(), getLegalExpenses: vi.fn(), getLegalExpensesExportUrl: vi.fn(), getLegalInjuredParties: vi.fn(), getLegalRecoverables: vi.fn(), createLegalExpense: vi.fn(), createLegalInjuredParty: vi.fn(), createLegalNews: vi.fn(), createLegalRecoverable: vi.fn(), deleteLegalInjuredParty: vi.fn(), updateLegalInjuredParty: vi.fn(), collectLegalRecoverable: vi.fn(),
}));
vi.mock('@/modules/cases/components/documents-section', () => ({ DocumentsSection: () => null }));
vi.mock('@/shared/api/http-client', () => ({ requestJson: vi.fn() }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe('ThirdPartyLawyerEditor', () => {
  beforeEach(() => { legalCase = null; saveLegalCase.mockClear(); });

  it('shows and saves the four judicial fields, then restores them on reload', async () => {
    legalCase = { instanceCode: 'JUDICIAL', entryDate: '2026-01-15', cuij: 'CUIJ-1', court: 'Juzgado 1', caseNumber: 'Autos 1' };
    const { rerender } = render(<ThirdPartyLawyerEditor caseId={42} />);
    await waitFor(() => expect(screen.getByLabelText('Fecha de ingreso *')).toHaveValue('2026-01-15'));
    expect(screen.getByLabelText('Nº CUIJ *')).toHaveValue('CUIJ-1');
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(saveLegalCase).toHaveBeenCalledWith(42, expect.objectContaining({ entryDate: '2026-01-15', cuij: 'CUIJ-1', court: 'Juzgado 1', caseNumber: 'Autos 1' })));
    rerender(<ThirdPartyLawyerEditor caseId={42} />);
    expect(screen.getByLabelText('Autos *')).toHaveValue('Autos 1');
  });

  it('hides judicial fields and does not require them for administrativa', async () => {
    legalCase = { instanceCode: 'ADMINISTRATIVA', counterpartLawyer: 'Dra. Pérez', counterpartPhone: '341-1', counterpartEmail: 'perez@test.com' };
    render(<ThirdPartyLawyerEditor caseId={42} />);
    await waitFor(() => expect(screen.queryByLabelText('Nº CUIJ *')).toBeNull());
    expect(screen.queryByLabelText('Fecha de ingreso *')).toBeNull();
    expect(screen.getByLabelText('Abogado contraparte')).toHaveValue('Dra. Pérez');
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeEnabled();
  });
});
