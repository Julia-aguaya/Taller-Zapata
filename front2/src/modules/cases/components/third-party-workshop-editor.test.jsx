import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThirdPartyWorkshopEditor } from './third-party-workshop-editor';

let thirdParty;
const queryClient = { invalidateQueries: vi.fn(), setQueryData: vi.fn() };
const saveThirdParty = vi.fn();

vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }) => ({
    data: queryKey[2] === 'third-party' ? thirdParty
      : queryKey[0] === 'insurance' && queryKey[1] === 'catalogs' ? { partsProvisionModeCodes: [{ code: 'COMPANIA', name: 'Compañía' }, { code: 'TALLER', name: 'Taller' }, { code: 'CLIENTE', name: 'Cliente' }], thirdPartyDocumentationStatusCodes: [{ code: 'PENDIENTE', name: 'Pendiente' }, { code: 'ACEPTADA', name: 'Aceptada' }] }
        : [],
    isLoading: false,
  }),
  useMutation: (config) => ({ isPending: false, mutate: async (payload) => { try { const result = await config.mutationFn(payload); await config.onSuccess?.(result); } catch (error) { await config.onError?.(error); } } }),
  useQueryClient: () => queryClient,
}));
vi.mock('@/modules/cases/api/third-party-api', () => ({ getThirdParty: vi.fn(), saveThirdParty: (...args) => saveThirdParty(...args), getCasePersons: vi.fn(), addCasePerson: vi.fn(), deleteCasePerson: vi.fn(), updateCasePerson: vi.fn() }));
vi.mock('@/modules/cases/api/new-case-api', () => ({ createPerson: vi.fn(), listInsuranceCompanies: vi.fn(), searchPersons: vi.fn() }));
vi.mock('@/shared/api/http-client', () => ({ requestJson: vi.fn() }));
vi.mock('@/modules/cases/components/claim-data-section', () => ({ ClaimDataSection: () => null }));
vi.mock('@/modules/cases/components/lawyer-third-party-incident-section', () => ({ LawyerThirdPartyIncidentSection: () => <output data-testid="lawyer-incident">Siniestro abogado</output> }));
vi.mock('@/modules/cases/components/documents-section', () => ({ DocumentsSection: ({ moduleCode, includeHistorical, title }) => <output data-testid="tramite-documents">{`${moduleCode}:${includeHistorical}:${title}`}</output> }));
vi.mock('@/modules/cases/components/procedure-section', () => ({ ProcedureSection: () => null }));
vi.mock('@/modules/cases/components/task-agenda', () => ({ TaskAgenda: () => null }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const renderEditor = () => render(<ThirdPartyWorkshopEditor caseId="42" caseDetail={{ caseTypeCode: 'RECLAMO_TERCEROS' }} budget={null} />);

describe('ThirdPartyWorkshopEditor', () => {
  beforeEach(() => {
    thirdParty = { partsProvisionModeCode: 'TALLER', minimumPartsAmount: 1200, bestQuotationSubtotal: 1200, finalPartsTotal: 800, amountToBillCompany: 3000, finalAmountForWorkshop: 2200 };
    queryClient.invalidateQueries.mockClear();
    queryClient.setQueryData.mockClear();
    saveThirdParty.mockReset();
    saveThirdParty.mockResolvedValue(thirdParty);
  });

  it('limits providers to Compañía, Taller and Cliente and shows calculated workshop totals', async () => {
    renderEditor();

    await waitFor(() => expect(screen.getByLabelText('Provee repuestos')).toHaveValue('TALLER'));
    expect(Array.from(screen.getByLabelText('Provee repuestos').options).map((option) => option.textContent)).toEqual(['Seleccionar…', 'Compañía', 'Taller', 'Cliente']);
    expect(screen.getByLabelText('Mínimo repuestos')).toHaveAttribute('readonly');
    expect(screen.getByLabelText('Mínimo repuestos')).toHaveValue('1200');
    expect(screen.getByLabelText('Total final repuestos')).toHaveAttribute('readonly');
    expect(screen.getByLabelText('Total final repuestos')).toHaveValue('800');
    expect(screen.getByLabelText('Final a favor taller')).toHaveAttribute('readonly');
    expect(screen.getByLabelText('Final a favor taller')).toHaveValue('2200');
  });

  it('does not show the removed third-party-claim or legacy documentation controls', async () => {
    thirdParty = { ...thirdParty, thirdPartyCompanyId: 9, claimReference: 'REC-42', documentationStatusCode: 'ACEPTADA' };
    renderEditor();

    expect(screen.queryByRole('heading', { name: /reclamo ante (el )?3ero|reclamo ante tercero/i })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Datos de cobertura y acuerdo' })).toBeInTheDocument();
    expect(screen.getByLabelText('Compañía del tercero')).toBeInTheDocument();
    expect(screen.getByLabelText('Referencia de reclamo')).toHaveValue('REC-42');
    expect(screen.queryByLabelText('Documentación')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Documentación completa')).not.toBeInTheDocument();
    expect(screen.getByLabelText('A facturar compañía')).toHaveValue('3000');
  });

  it('keeps only trámite documents in this context and delegates budget/egress files to their own modules', () => {
    renderEditor();
    expect(screen.getByTestId('tramite-documents')).toHaveTextContent('GESTION_TRAMITE:true:Documentación del trámite');
  });

  it.each(['COMPANIA', 'CLIENTE'])('does not show orders total when %s provides parts', async (partsProvisionModeCode) => {
    thirdParty = { ...thirdParty, partsProvisionModeCode, finalPartsTotal: null, finalAmountForWorkshop: 3000 };
    renderEditor();

    await waitFor(() => expect(screen.getByLabelText('Provee repuestos')).toHaveValue(partsProvisionModeCode));
    expect(screen.queryByLabelText('Total final repuestos')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Final a favor taller')).toHaveValue('3000');
  });

  it('does not let a legacy documentation value affect the coverage save request', async () => {
    thirdParty = { ...thirdParty, documentationStatusCode: 'ACEPTADA', documentationAccepted: true };
    renderEditor();

    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(saveThirdParty).toHaveBeenCalledWith('42', expect.not.objectContaining({ documentationAccepted: expect.anything(), documentationStatusCode: expect.anything() })));
  });

  it('replaces cached agreement minimums with the persisted response after saving', async () => {
    const persisted = { ...thirdParty, minimumLaborAmount: 71234.56, minimumPartsAmount: 34567.89 };
    saveThirdParty.mockResolvedValueOnce(persisted);
    renderEditor();

    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(saveThirdParty).toHaveBeenCalledWith('42', expect.objectContaining({ partsProvisionModeCode: 'TALLER' })));
    expect(queryClient.setQueryData).toHaveBeenCalledWith(['cases', '42', 'third-party'], persisted);
  });

  it('uses the dedicated incident form only for lawyer-managed third-party claims', () => {
    render(<ThirdPartyWorkshopEditor caseId="42" caseDetail={{ caseTypeCode: 'RECLAMO_TERCEROS_ABOGADO' }} budget={null} lawyerManaged />);
    expect(screen.getByTestId('lawyer-incident')).toBeInTheDocument();
  });
});
