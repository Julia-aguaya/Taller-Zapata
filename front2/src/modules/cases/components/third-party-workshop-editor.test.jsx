import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThirdPartyWorkshopEditor } from './third-party-workshop-editor';

let thirdParty;

vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }) => ({
    data: queryKey[2] === 'third-party' ? thirdParty
      : queryKey[0] === 'insurance' && queryKey[1] === 'catalogs' ? { partsProvisionModeCodes: [{ code: 'COMPANIA', name: 'Compañía' }, { code: 'TALLER', name: 'Taller' }, { code: 'CLIENTE', name: 'Cliente' }], thirdPartyDocumentationStatusCodes: [{ code: 'PENDIENTE', name: 'Pendiente' }, { code: 'ACEPTADA', name: 'Aceptada' }] }
        : [],
    isLoading: false,
  }),
  useMutation: (config) => ({ isPending: false, mutate: async (payload) => { try { const result = await config.mutationFn(payload); await config.onSuccess?.(result); } catch (error) { await config.onError?.(error); } } }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));
vi.mock('@/modules/cases/api/third-party-api', () => ({ getThirdParty: vi.fn(), saveThirdParty: vi.fn(), getCasePersons: vi.fn(), addCasePerson: vi.fn(), deleteCasePerson: vi.fn(), updateCasePerson: vi.fn() }));
vi.mock('@/modules/cases/api/new-case-api', () => ({ createPerson: vi.fn(), listInsuranceCompanies: vi.fn(), searchPersons: vi.fn() }));
vi.mock('@/shared/api/http-client', () => ({ requestJson: vi.fn() }));
vi.mock('@/modules/cases/components/claim-data-section', () => ({ ClaimDataSection: () => null }));
vi.mock('@/modules/cases/components/documents-section', () => ({ DocumentsSection: ({ moduleCode, includeHistorical, title }) => <output data-testid="tramite-documents">{`${moduleCode}:${includeHistorical}:${title}`}</output> }));
vi.mock('@/modules/cases/components/procedure-section', () => ({ ProcedureSection: () => null }));
vi.mock('@/modules/cases/components/task-agenda', () => ({ TaskAgenda: () => null }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const renderEditor = () => render(<ThirdPartyWorkshopEditor caseId="42" caseDetail={{ caseTypeCode: 'RECLAMO_TERCEROS' }} budget={null} />);

describe('ThirdPartyWorkshopEditor', () => {
  beforeEach(() => {
    thirdParty = { partsProvisionModeCode: 'TALLER', minimumPartsAmount: 1200, bestQuotationSubtotal: 1200, finalPartsTotal: 800, amountToBillCompany: 3000, finalAmountForWorkshop: 2200 };
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

  it('does not show the removed third-party-claim block and keeps coverage data available', async () => {
    thirdParty = { ...thirdParty, thirdPartyCompanyId: 9, claimReference: 'REC-42', documentationStatusCode: 'ACEPTADA' };
    renderEditor();

    expect(screen.queryByRole('heading', { name: /reclamo ante (el )?3ero|reclamo ante tercero/i })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Datos de cobertura y acuerdo' })).toBeInTheDocument();
    expect(screen.getByLabelText('Compañía del tercero')).toBeInTheDocument();
    expect(screen.getByLabelText('Referencia de reclamo')).toHaveValue('REC-42');
    expect(screen.getByLabelText('Documentación')).toHaveValue('ACEPTADA');
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

  it('synchronizes complete documentation, dismisses its warning, and restores it when incomplete', async () => {
    thirdParty = { ...thirdParty, documentationStatusCode: 'PENDIENTE', documentationAccepted: false };
    renderEditor();

    expect(await screen.findByRole('dialog', { name: 'Carpeta con documentación pendiente' })).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Documentación completa'));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Carpeta con documentación pendiente' })).not.toBeInTheDocument());

    fireEvent.click(screen.getByLabelText('Documentación completa'));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(await screen.findByRole('dialog', { name: 'Carpeta con documentación pendiente' })).toBeInTheDocument();
  });

  it('does not reopen the pending-documentation dialog for persisted complete documentation', async () => {
    thirdParty = { ...thirdParty, documentationStatusCode: 'ACEPTADA', documentationAccepted: true };
    renderEditor();

    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Carpeta con documentación pendiente' })).not.toBeInTheDocument());
  });
});
