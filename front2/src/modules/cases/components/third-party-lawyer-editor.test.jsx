import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThirdPartyLawyerEditor } from './third-party-lawyer-editor';

const saveLegalCase = vi.fn().mockResolvedValue({});
const setQueryData = vi.fn();
let legalCase = null;
let documentsProps;
let agendaProps;

vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }) => ({ data: queryKey.at(-1) === 'legal' ? legalCase : queryKey.at(-1) === 'catalogs' ? { legalProcessorCodes: [], legalClaimantCodes: [], legalInstanceCodes: [{ code: 'ADMINISTRATIVA', name: 'Administrativa' }, { code: 'JUDICIAL', name: 'Judicial' }], legalClosureReasonCodes: [{ code: 'CONCILIACION', name: 'Conciliación' }], legalExpensePayerCodes: [] } : [] }),
  useMutation: ({ mutationFn, onSuccess }) => ({ isPending: false, mutate: async () => onSuccess?.(await mutationFn()) }),
  useQueryClient: () => ({ invalidateQueries: vi.fn(), setQueryData }),
}));
vi.mock('@/modules/cases/api/third-party-api', () => ({
  getLegalCase: vi.fn(), saveLegalCase: (...args) => saveLegalCase(...args), getCasePersons: vi.fn(), getLegalNews: vi.fn(), getLegalExpenses: vi.fn(), getLegalExpensesExportUrl: vi.fn(), getLegalInjuredParties: vi.fn(), getLegalRecoverables: vi.fn(), createLegalExpense: vi.fn(), createLegalInjuredParty: vi.fn(), createLegalNews: vi.fn(), createLegalRecoverable: vi.fn(), deleteLegalInjuredParty: vi.fn(), updateLegalInjuredParty: vi.fn(), collectLegalRecoverable: vi.fn(),
}));
vi.mock('@/modules/cases/components/documents-section', () => ({ DocumentsSection: (props) => { documentsProps = props; return null; } }));
vi.mock('@/modules/cases/components/task-agenda', () => ({ TaskAgenda: (props) => { agendaProps = props; return null; } }));
vi.mock('@/shared/api/http-client', () => ({ requestJson: vi.fn() }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe('ThirdPartyLawyerEditor', () => {
  beforeEach(() => { legalCase = null; documentsProps = null; agendaProps = null; saveLegalCase.mockClear(); setQueryData.mockClear(); });

  it('shows and saves the four judicial fields, then restores them on reload', async () => {
    legalCase = { instanceCode: 'JUDICIAL', entryDate: '2026-01-15', cuij: 'CUIJ-1', court: 'Juzgado 1', caseNumber: 'Autos 1' };
    saveLegalCase.mockResolvedValue(legalCase);
    const { rerender } = render(<ThirdPartyLawyerEditor caseId={42} />);
    await waitFor(() => expect(screen.getByLabelText('Fecha de ingreso')).toHaveValue('2026-01-15'));
    expect(screen.getByLabelText('Nº CUIJ *')).toHaveValue('CUIJ-1');
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(saveLegalCase).toHaveBeenCalledWith(42, expect.objectContaining({ entryDate: '2026-01-15', cuij: 'CUIJ-1', court: 'Juzgado 1', caseNumber: 'Autos 1' })));
    expect(setQueryData).toHaveBeenCalledWith(['cases', '42', 'legal'], expect.objectContaining({ instanceCode: 'JUDICIAL' }));
    rerender(<ThirdPartyLawyerEditor caseId={42} />);
    expect(screen.getByLabelText('Autos *')).toHaveValue('Autos 1');
  });

  it('hides judicial fields and does not require them for administrativa', async () => {
    legalCase = { instanceCode: 'ADMINISTRATIVA', counterpartLawyer: 'Dra. Pérez', counterpartPhone: '341-1', counterpartEmail: 'perez@test.com' };
    render(<ThirdPartyLawyerEditor caseId={42} />);
    await waitFor(() => expect(screen.queryByLabelText('Nº CUIJ *')).toBeNull());
    expect(screen.getByLabelText('Fecha de ingreso')).toBeInTheDocument();
    expect(screen.getByLabelText('Días tramitando')).toBeInTheDocument();
    expect(screen.getByLabelText('Abogado contraparte')).toHaveValue('Dra. Pérez');
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeEnabled();
  });

  it('forwards agenda context, scopes legal documents, and hydrates then saves closure fields', async () => {
    legalCase = { instanceCode: 'ADMINISTRATIVA', closedByCode: 'CONCILIACION', legalCloseDate: '2026-03-10', totalProceedsAmount: 125000, closingNotes: 'Acuerdo homologado' };
    saveLegalCase.mockResolvedValue(legalCase);
    render(<ThirdPartyLawyerEditor caseId={42} caseDetail={{ organizationId: 9, branchId: 3 }} />);

    await waitFor(() => expect(screen.getByLabelText('Cierre por')).toHaveValue('CONCILIACION'));
    expect(screen.getByLabelText('Fecha de cierre')).toHaveValue('2026-03-10');
    expect(screen.getByLabelText('Importe total')).toHaveValue(125000);
    expect(screen.getByPlaceholderText('Notas de cierre')).toHaveValue('Acuerdo homologado');
    expect(documentsProps).toMatchObject({ caseId: 42, moduleCode: 'LEGAL', includeHistorical: false, showCompleteAction: false, title: 'Documentación legal y de cierre', collapsible: true });
    expect(documentsProps.categoryCodes).toEqual(new Set(['EXPEDIENTE_LEGAL', 'CIERRE_LEGAL']));
    expect(agendaProps).toEqual({ caseId: 42, organizationId: 9, branchId: 3 });

    fireEvent.change(screen.getByLabelText('Importe total'), { target: { value: '150000' } });
    fireEvent.change(screen.getByPlaceholderText('Notas de cierre'), { target: { value: 'Cierre actualizado' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(saveLegalCase).toHaveBeenCalledWith(42, expect.objectContaining({ closedByCode: 'CONCILIACION', legalCloseDate: '2026-03-10', totalProceedsAmount: 150000, closingNotes: 'Cierre actualizado' })));
  });
});
