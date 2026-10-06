import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThirdPartyLawyerEditor } from './third-party-lawyer-editor';

const saveLegalCase = vi.fn().mockResolvedValue({});
const createLegalExpense = vi.fn().mockResolvedValue({});
const updateLegalExpense = vi.fn().mockResolvedValue({});
const deleteLegalExpense = vi.fn().mockResolvedValue({});
const createLegalInjuredParty = vi.fn().mockResolvedValue({});
const updateLegalNews = vi.fn().mockResolvedValue({});
const deleteLegalNews = vi.fn().mockResolvedValue({});
const collectLegalRecoverable = vi.fn().mockResolvedValue({});
const updateLegalRecoverable = vi.fn().mockResolvedValue({});
const deleteLegalRecoverable = vi.fn().mockResolvedValue({});
const requestJson = vi.fn();
const setQueryData = vi.fn();
let legalCase = null;
let legalNews = [];
let legalExpenses = [];
let legalRecoverables = [];
let legalInjured = [];
let casePersons = [];
let documentsProps;
let agendaProps;

vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }) => ({ data: queryKey.at(-1) === 'legal' ? legalCase : queryKey.at(-1) === 'legal-news' ? legalNews : queryKey.at(-1) === 'legal-expenses' ? legalExpenses : queryKey.at(-1) === 'legal-recoverables' ? legalRecoverables : queryKey.at(-1) === 'legal-injured' ? legalInjured : queryKey.at(-1) === 'persons' ? casePersons : queryKey.at(-1) === 'catalogs' ? { legalProcessorCodes: [], legalClaimantCodes: [{ code: 'DANIO_MATERIAL', name: 'Daño material' }, { code: 'DANIO_MATERIAL_LESIONES', name: 'Daño material y lesiones' }, { code: 'FRANQUICIA_LESIONES', name: 'Franquicia y lesiones' }], legalInstanceCodes: [{ code: 'ADMINISTRATIVA', name: 'Administrativa' }, { code: 'JUDICIAL', name: 'Judicial' }], legalClosureReasonCodes: [{ code: 'CONCILIACION', name: 'Conciliación' }], legalExpensePayerCodes: [{ code: 'TALLER', name: 'Taller' }], lesionadoEsCodes: [{ code: 'TITULAR_REGISTRAL', name: 'Titular registral' }, { code: 'CLIENTE', name: 'Cliente' }, { code: 'OTRO', name: 'Otro' }] } : [] }),
  useMutation: ({ mutationFn, onSuccess }) => ({ isPending: false, mutate: async (payload) => onSuccess?.(await mutationFn(payload)) }),
  useQueryClient: () => ({ invalidateQueries: vi.fn(), setQueryData }),
}));
vi.mock('@/modules/cases/api/third-party-api', () => ({
  getLegalCase: vi.fn(), saveLegalCase: (...args) => saveLegalCase(...args), getCasePersons: vi.fn(), getLegalNews: vi.fn(), getLegalExpenses: vi.fn(), getLegalExpensesExportUrl: vi.fn(), getLegalInjuredParties: vi.fn(), getLegalRecoverables: vi.fn(), createLegalExpense: (...args) => createLegalExpense(...args), updateLegalExpense: (...args) => updateLegalExpense(...args), deleteLegalExpense: (...args) => deleteLegalExpense(...args), createLegalInjuredParty: (...args) => createLegalInjuredParty(...args), createLegalNews: vi.fn(), updateLegalNews: (...args) => updateLegalNews(...args), deleteLegalNews: (...args) => deleteLegalNews(...args), createLegalRecoverable: vi.fn(), updateLegalRecoverable: (...args) => updateLegalRecoverable(...args), deleteLegalRecoverable: (...args) => deleteLegalRecoverable(...args), deleteLegalInjuredParty: vi.fn(), updateLegalInjuredParty: vi.fn(), collectLegalRecoverable: (...args) => collectLegalRecoverable(...args),
}));
vi.mock('@/modules/cases/components/documents-section', () => ({ DocumentsSection: (props) => { documentsProps.push(props); return <div>{props.title}</div>; } }));
vi.mock('@/modules/cases/components/task-agenda', () => ({ TaskAgenda: (props) => { agendaProps = props; return <div data-testid="task-agenda">Agenda de tareas</div>; } }));
vi.mock('@/shared/api/http-client', () => ({ requestJson: (...args) => requestJson(...args) }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe('ThirdPartyLawyerEditor', () => {
  beforeEach(() => { legalCase = null; legalNews = []; legalExpenses = []; legalRecoverables = []; legalInjured = []; casePersons = []; documentsProps = []; agendaProps = null; requestJson.mockReset(); saveLegalCase.mockClear(); createLegalExpense.mockClear(); createLegalInjuredParty.mockClear(); updateLegalNews.mockClear(); deleteLegalNews.mockClear(); collectLegalRecoverable.mockClear(); setQueryData.mockClear(); });

  it('shows and saves the four judicial fields, then restores them on reload', async () => {
    legalCase = { instanceCode: 'JUDICIAL', entryDate: '2026-01-15', cuij: 'CUIJ-1', court: 'Juzgado 1', caseNumber: 'Autos 1' };
    saveLegalCase.mockResolvedValue(legalCase);
    const { rerender } = render(<ThirdPartyLawyerEditor caseId={42} />);
    await waitFor(() => expect(screen.getByLabelText('Fecha de ingreso')).toHaveValue('2026-01-15'));
    expect(screen.getByLabelText('Nº CUIJ *')).toHaveValue('CUIJ-1');
    const fieldGrid = screen.getByLabelText('Tramita').closest('div');
    expect(Array.from(fieldGrid.children).map((field) => field.querySelector('span').textContent)).toEqual([
      'Tramita', 'Reclama', 'Instancia', 'Fecha de ingreso', 'Nº CUIJ *', 'Juzgado *', 'Autos *',
      'Días tramitando', 'Abogado contraparte', 'Teléfono contraparte', 'Email contraparte',
    ]);
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

  it('forwards agenda context, includes closing documentation, and hydrates then saves closure fields', async () => {
    legalCase = { instanceCode: 'ADMINISTRATIVA', closedByCode: 'CONCILIACION', legalCloseDate: '2026-03-10', totalProceedsAmount: 125000, closingNotes: 'Acuerdo homologado' };
    saveLegalCase.mockResolvedValue(legalCase);
    render(<ThirdPartyLawyerEditor caseId={42} caseDetail={{ organizationId: 9, branchId: 3 }} />);

    await waitFor(() => expect(screen.getByLabelText('Cierre por')).toHaveTextContent('CONCILIACION'));
    expect(screen.getByLabelText('Fecha de cierre')).toHaveValue('2026-03-10');
    expect(screen.getByLabelText('Importe total')).toHaveValue(125000);
    expect(screen.getByPlaceholderText('Anotaciones de cierre')).toHaveValue('Acuerdo homologado');
    expect(documentsProps).toEqual(expect.arrayContaining([
      expect.objectContaining({ caseId: 42, moduleCode: 'LEGAL', includeHistorical: false, showCompleteAction: false, title: 'Documentación Expediente', categoryCodes: new Set(['PERSONAL', 'SEGURO', 'OTRO']), collapsible: true }),
    ]));
    expect(documentsProps).toEqual(expect.arrayContaining([expect.objectContaining({ title: 'Documentación de cierre', categoryCodes: new Set(['CIERRE_LEGAL']) })]));
    expect(screen.getByText('Documentación Expediente')).toBeInTheDocument();
    expect(screen.getByText('Documentación de cierre')).toBeInTheDocument();
    expect(agendaProps).toEqual({ caseId: 42, organizationId: 9, branchId: 3 });
    expect(screen.getByText('Estado del expediente').compareDocumentPosition(screen.getByTestId('task-agenda')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByTestId('task-agenda').compareDocumentPosition(screen.getByText('Cierre, gastos y rubros')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Importe total'), { target: { value: '150000' } });
    fireEvent.change(screen.getByPlaceholderText('Anotaciones de cierre'), { target: { value: 'Cierre actualizado' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cierre' }));
    await waitFor(() => expect(saveLegalCase).toHaveBeenCalledWith(42, expect.objectContaining({ closedByCode: 'CONCILIACION', legalCloseDate: '2026-03-10', totalProceedsAmount: 150000, closingNotes: 'Cierre actualizado' })));
  });

  it('moves vehicle repair out of the lawyer tab, keeps observations accessible, and persists expenses separately from rubros', async () => {
    legalCase = { instanceCode: 'ADMINISTRATIVA', observations: 'Antecedente guardado' };
    legalExpenses = [{ id: 3, concept: 'Tasa de justicia', amount: 500, expenseDate: '2026-03-10', paidByCode: 'ABOGADO' }];
    render(<ThirdPartyLawyerEditor caseId={42} />);

    await waitFor(() => expect(screen.queryByLabelText('Repara vehículo')).toBeNull());
    const observations = screen.getByRole('button', { name: 'Observaciones y antecedentes del caso' });
    expect(observations).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(observations);
    expect(screen.getByPlaceholderText('Observaciones y antecedentes del caso')).toHaveValue('Antecedente guardado');
    fireEvent.click(screen.getByRole('button', { name: 'Agregar gasto' }));
    const expenseDialog = screen.getByRole('dialog', { name: 'Agregar gasto' });
    fireEvent.change(within(expenseDialog).getByLabelText('Concepto de gasto'), { target: { value: 'Honorarios' } });
    fireEvent.change(within(expenseDialog).getByLabelText('Monto de gasto'), { target: { value: '1500' } });
    fireEvent.click(within(expenseDialog).getByLabelText('Abonó gasto'));
    fireEvent.click(screen.getByRole('option', { name: 'ABOGADO' }));
    fireEvent.change(within(expenseDialog).getByLabelText('Fecha de gasto'), { target: { value: '2026-04-01' } });
    fireEvent.click(within(expenseDialog).getByRole('button', { name: 'Agregar gasto' }));

    await waitFor(() => expect(createLegalExpense).toHaveBeenCalledWith(42, expect.objectContaining({ concept: 'Honorarios', amount: 1500, paidByCode: 'ABOGADO' })));
    expect(screen.getByText('Detalle de rubros')).toBeInTheDocument();
    expect(screen.getByText('Tasa de justicia')).toBeInTheDocument();
    expect(screen.getByText('Tasa de justicia').closest('tr')).toHaveTextContent('ABOGADO');
  });

  it('shows each rubro movement and collection state without a separate collection flow', async () => {
    legalCase = { instanceCode: 'ADMINISTRATIVA' };
    legalRecoverables = [
      { id: 1, concept: 'No suma', amount: 100, sumsToWorkshop: false, collectionStatusCode: 'PENDIENTE', financialMovementId: null },
      { id: 2, concept: 'Pendiente taller', amount: 200, sumsToWorkshop: true, collectionStatusCode: 'PENDIENTE', financialMovementId: null },
      { id: 3, concept: 'Cobrado taller', amount: 300, sumsToWorkshop: true, collectionStatusCode: 'COBRADO', financialMovementId: 77 },
    ];
    render(<ThirdPartyLawyerEditor caseId={42} />);

    await waitFor(() => expect(screen.getByText('Pendiente taller')).toBeInTheDocument());
    expect(screen.getByText('No suma').closest('tr')).toHaveTextContent('—');
    expect(screen.getByText('Cobrado taller').closest('tr')).toHaveTextContent('#77');
    expect(screen.queryByRole('button', { name: 'Registrar cobro' })).toBeNull();
  });

  it('only shows the injury claimant block for claims that include injuries, before observations', async () => {
    legalCase = { instanceCode: 'ADMINISTRATIVA', claimantCode: 'DANIO_MATERIAL' };
    const { rerender } = render(<ThirdPartyLawyerEditor caseId={42} />);
    await waitFor(() => expect(screen.queryByText('Reclamante lesiones')).toBeNull());

    legalCase = { instanceCode: 'ADMINISTRATIVA', claimantCode: 'FRANQUICIA_LESIONES' };
    rerender(<ThirdPartyLawyerEditor caseId={42} />);
    await waitFor(() => expect(screen.getByText('Reclamante lesiones')).toBeInTheDocument());
    expect(screen.getByText('Reclamante lesiones').compareDocumentPosition(screen.getByRole('button', { name: 'Observaciones y antecedentes del caso' })) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('preloads a linked client snapshot, calculates age for 29/02, and sends it as the injury payload', async () => {
    legalCase = { instanceCode: 'ADMINISTRATIVA', claimantCode: 'DANIO_MATERIAL_LESIONES' };
    casePersons = [{ personId: 10, displayName: 'Ana Cliente', caseRoleCode: 'CLIENTE' }, { personId: 11, displayName: 'Tom Titular', caseRoleCode: 'TITULAR' }];
    requestJson.mockImplementation((path) => path === '/persons/10' ? Promise.resolve({ id: 10, apellido: 'Cliente', nombre: 'Ana', numeroDocumento: '30111222', fechaNacimiento: '1996-02-29', estadoCivilCodigo: 'SOLTERO', telefonoPrincipal: '341-555', emailPrincipal: 'ana@example.com', ocupacion: 'Docente', observaciones: 'Dato canónico' }) : Promise.resolve([{ calle: 'San Martín', numero: '123', localidad: 'Rosario', principal: true }]));
    render(<ThirdPartyLawyerEditor caseId={42} />);

    await waitFor(() => expect(screen.getByText('Reclamante lesiones')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Lesionado es'), { target: { value: 'CLIENTE' } });
    fireEvent.change(screen.getByLabelText('Persona vinculada'), { target: { value: '10' } });
    await waitFor(() => expect(screen.getByLabelText('Apellido')).toHaveValue('Cliente'));
    expect(screen.getByLabelText('Nombres')).toHaveValue('Ana');
    expect(screen.getByLabelText('Domicilio')).toHaveValue('San Martín, 123, Rosario');
    expect(screen.getByLabelText('Edad')).toHaveValue(String(new Date().getFullYear() - 1996 - (new Date().getMonth() < 1 || (new Date().getMonth() === 1 && new Date().getDate() < 29) ? 1 : 0)));
    fireEvent.change(screen.getAllByLabelText('Anotaciones')[0], { target: { value: 'Prueba incorporada' } });
    fireEvent.click(screen.getByRole('button', { name: 'Agregar reclamante' }));

    await waitFor(() => expect(createLegalInjuredParty).toHaveBeenCalledWith(42, expect.objectContaining({ lesionadoEsCode: 'CLIENTE', personId: 10, lastName: 'Cliente', firstName: 'Ana', birthDate: '1996-02-29', address: 'San Martín, 123, Rosario', notes: 'Prueba incorporada', fullName: null })));
    expect(requestJson).toHaveBeenCalledWith('/persons/10');
    expect(requestJson).toHaveBeenCalledWith('/persons/10/addresses');
  });

  it('only offers and preloads registered owners when titular registral is selected', async () => {
    legalCase = { instanceCode: 'ADMINISTRATIVA', claimantCode: 'DANIO_MATERIAL_LESIONES' };
    casePersons = [{ personId: 10, displayName: 'Ana Cliente', caseRoleCode: 'CLIENTE' }, { personId: 11, displayName: 'Tom Titular', caseRoleCode: 'TITULAR' }];
    requestJson.mockImplementation((path) => path === '/persons/11' ? Promise.resolve({ id: 11, apellido: 'Titular', nombre: 'Tom', numeroDocumento: '28999111', fechaNacimiento: '1988-05-03' }) : Promise.resolve([]));
    render(<ThirdPartyLawyerEditor caseId={42} />);

    await waitFor(() => expect(screen.getByText('Reclamante lesiones')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Lesionado es'), { target: { value: 'TITULAR_REGISTRAL' } });
    expect(screen.getByRole('option', { name: 'Tom Titular' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Ana Cliente' })).toBeNull();
    fireEvent.change(screen.getByLabelText('Persona vinculada'), { target: { value: '11' } });
    await waitFor(() => expect(screen.getByLabelText('Apellido')).toHaveValue('Titular'));
    expect(screen.getByLabelText('Nombres')).toHaveValue('Tom');
  });

  it('shows income proof and edits or removes legal news without sending notifications', async () => {
    legalCase = { instanceCode: 'ADMINISTRATIVA', claimantCode: 'DANIO_MATERIAL_LESIONES' };
    legalNews = [{ id: 7, newsDate: '2026-03-10', detail: 'Demanda presentada', notifyCustomer: false }];
    render(<ThirdPartyLawyerEditor caseId={42} />);

    await waitFor(() => expect(screen.getByLabelText('Acredita ingresos')).toHaveTextContent('No'));
    fireEvent.click(screen.getByLabelText('Acredita ingresos'));
    fireEvent.click(screen.getByRole('option', { name: 'Sí' }));
    expect(screen.getByLabelText('Acredita ingresos')).toHaveTextContent('Sí');
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    expect(screen.getByLabelText('Actualización')).toHaveValue('Demanda presentada');
    fireEvent.click(screen.getByLabelText('Notificada al cliente'));
    fireEvent.click(screen.getByRole('option', { name: 'Sí' }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    await waitFor(() => expect(updateLegalNews).toHaveBeenCalledWith(42, 7, { newsDate: '2026-03-10', detail: 'Demanda presentada', notifyCustomer: true }));
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    await waitFor(() => expect(deleteLegalNews).toHaveBeenCalledWith(42, 7));
  });

  it('opens an empty legal-news dialog and resets it when cancelled', async () => {
    legalCase = { instanceCode: 'ADMINISTRATIVA' };
    render(<ThirdPartyLawyerEditor caseId={42} />);

    expect(screen.queryByLabelText('Fecha de novedad')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Agregar actualización' }));
    const dialog = screen.getByRole('dialog', { name: 'Agregar actualización' });
    fireEvent.change(within(dialog).getByLabelText('Actualización'), { target: { value: 'Demanda presentada' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Agregar actualización' }));
    expect(screen.getByLabelText('Actualización')).toHaveValue('');
  });
});
