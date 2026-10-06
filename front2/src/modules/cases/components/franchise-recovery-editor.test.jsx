import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FranchiseRecoveryEditor } from './franchise-recovery-editor';

const navigate = vi.fn();
let recovery = null;
let catalogs = { managerCodes: [], opinionCodes: [], paymentStatusCodes: [] };
let companies = [];
let workshop = null;
let contacts = [];
let people = {};

vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));
vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }) => ({ data: queryKey[2] === 'franchise-recovery' ? recovery : (queryKey[2] === 'third-party-workshop' ? workshop : (queryKey[2] === 'persons' ? [] : (queryKey[0] === 'persons' ? people[queryKey[1]] : (queryKey[0] === 'insurance' && queryKey[1] === 'companies' && queryKey.length === 2 ? companies : (queryKey[0] === 'insurance' && queryKey[3] === 'contacts' ? contacts : catalogs))))) }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  useMutation: () => ({ isPending: false, mutate: vi.fn() }),
}));
vi.mock('@/shared/api/http-client', () => ({ requestJson: vi.fn() }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/modules/cases/components/documents-section', () => ({ DocumentsSection: (props) => <div aria-label="Documentación" data-module={props.moduleCode} data-origin={props.originCode}>Documentación</div> }));

describe('FranchiseRecoveryEditor associated folder', () => {
  beforeEach(() => {
    navigate.mockReset();
    recovery = null;
    catalogs = { managerCodes: [], opinionCodes: [], paymentStatusCodes: [] };
    companies = [];
    workshop = null;
    contacts = [];
    people = {};
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

  it('offers only Taller and Abogado as recovery managers', () => {
    recovery = { id: 7, baseCaseId: 42, baseFolderCode: 'CAR-042' };
    catalogs = { managerCodes: [{ code: 'TALLER', name: 'Taller' }, { code: 'ABOGADO', name: 'Abogado' }, { code: 'CLIENTE', name: 'Cliente' }], opinionCodes: [], paymentStatusCodes: [] };
    render(<FranchiseRecoveryEditor caseId="7" caseDetail={{}} />);

    expect(screen.getByRole('option', { name: 'Taller' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Abogado' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Cliente' })).not.toBeInTheDocument();
  });

  it('labels associated Todo Riesgo data as read-only source data', () => {
    recovery = { id: 7, baseCaseId: 42, baseFolderCode: 'CAR-042' };
    render(<FranchiseRecoveryEditor caseId="7" caseDetail={{}} />);

    expect(screen.getByLabelText('Datos provenientes de la carpeta asociada')).toHaveTextContent('no se edita desde Recupero');
  });

  it('renders the initial general-data fields with backend-owned calculations', () => {
    recovery = { id: 7, baseCaseId: 42, baseFolderCode: 'CAR-042', baseFolderName: 'Todo Riesgo', incidentDate: '2026-01-10', presentedAt: '2026-01-12', prescriptionDate: '2029-01-12', daysInProcess: 3 };
    catalogs = { managerCodes: [{ code: 'TALLER', name: 'Taller' }], opinionCodes: [{ code: 'CULPA_COMPARTIDA', name: 'Culpa compartida' }], paymentStatusCodes: [] };
    render(<FranchiseRecoveryEditor caseId="7" caseDetail={{}} />);

    expect(screen.getByLabelText('Fecha del siniestro')).toHaveValue('2026-01-10');
    expect(screen.getByLabelText('Fecha presentado')).toHaveValue('2026-01-12');
    expect(screen.getByLabelText('Prescripción del trámite')).toHaveValue('2029-01-12');
    expect(screen.getByLabelText('Prescripción del trámite')).toHaveAttribute('readonly');
    expect(screen.getByLabelText('Días tramitando')).toHaveValue('3');
    expect(screen.getByLabelText('Días tramitando')).toHaveAttribute('readonly');
    expect(screen.getByLabelText('Carpeta asociada')).toHaveValue('CAR-042 · Todo Riesgo');
    expect(screen.getByRole('option', { name: 'Culpa compartida' })).toBeInTheDocument();
  });

  it('shows insurance companies by name and marks imported associated-folder data', () => {
    recovery = { id: 7, baseCaseId: 42, baseFolderCode: 'CAR-042', baseFolderName: 'Cliente Base' };
    companies = [{ id: 91, name: 'Aseguradora del Sur' }];
    render(<FranchiseRecoveryEditor caseId="7" caseDetail={{}} />);

    expect(screen.getByLabelText('Datos del seguro')).toHaveTextContent('Datos traídos de la carpeta asociada CAR-042');
    expect(screen.getAllByRole('option', { name: 'Aseguradora del Sur' }).length).toBeGreaterThan(0);
    expect(screen.queryByText('91')).not.toBeInTheDocument();
  });

  it('autocompletes an existing contact and exposes the creation fields', async () => {
    const user = userEvent.setup();
    companies = [{ id: 91, name: 'Aseguradora del Sur' }];
    workshop = { thirdPartyCompanyId: 91, claimReference: 'REF-1', processor: null, inspector: null };
    contacts = [{ id: 1, personId: 51, personName: 'Teresa Tramitadora', contactRoleCode: 'TRAMITADOR' }];
    people = { 51: { nombre: 'Teresa', apellido: 'Tramitadora', emailPrincipal: 'teresa@sur.test', telefonoPrincipal: '3415559999' } };
    render(<FranchiseRecoveryEditor caseId="7" caseDetail={{}} />);

    await user.selectOptions(screen.getByLabelText('Tramitador/a'), '51');
    expect(screen.getByLabelText('Correo Tramitador/a')).toHaveValue('teresa@sur.test');
    expect(screen.getByLabelText('Teléfono Tramitador/a')).toHaveValue('3415559999');
    await user.selectOptions(screen.getByLabelText('Inspector/a'), '__new');
    expect(screen.getByLabelText('Nombre Inspector/a')).toBeInTheDocument();
    expect(screen.getByLabelText('Correo Inspector/a')).toBeInTheDocument();
  });

  it('renders Datos del siniestro immediately after Datos del seguro without technical IDs', () => {
    render(<FranchiseRecoveryEditor caseId="7" caseDetail={{}} />);
    const sections = screen.getAllByRole('heading', { level: 4 });
    expect(sections.map((section) => section.textContent)).toContain('Datos del siniestro');
    expect(screen.queryByText(/^\d+$/)).not.toBeInTheDocument();
  });

  it('renders isolated Gestión del trámite documentation after the incident section', () => {
    render(<FranchiseRecoveryEditor caseId="7" caseDetail={{}} />);
    const docs = screen.getByLabelText('Documentación');
    expect(docs).toHaveAttribute('data-module', 'GESTION_TRAMITE');
    expect(docs).toHaveAttribute('data-origin', 'GESTION_TRAMITE');
  });

  it('renders server-calculated recovery amounts as read-only values', () => {
    recovery = { id: 7, minimumLaborAmount: 100, minimumPartsAmount: 200, finalPartsTotal: 80, amountToBillCompany: 300, finalAmountForWorkshop: 220 };
    render(<FranchiseRecoveryEditor caseId="7" caseDetail={{}} />);

    expect(screen.getByLabelText('Mínimo mano de obra')).toHaveValue('100');
    expect(screen.getByLabelText('Mínimo repuestos')).toHaveValue('200');
    expect(screen.getByLabelText('Total final repuestos')).toHaveValue('80');
    expect(screen.getByLabelText('A facturar Cía.')).toHaveValue('300');
    expect(screen.getByLabelText('Final a favor Taller')).toHaveValue('220');
    expect(screen.getByLabelText('A facturar Cía.')).toHaveAttribute('readonly');
  });

  it('shows the authorization warning only outside shared fault', () => {
    recovery = { id: 7, opinionCode: 'PROCEDE', agreedAmount: 100, recoveryAmount: 50 };
    const { rerender } = render(<FranchiseRecoveryEditor caseId="7" caseDetail={{}} />);
    expect(screen.getByText(/Requiere autorización del administrador/)).toBeInTheDocument();

    recovery = { ...recovery, opinionCode: 'CULPA_COMPARTIDA' };
    rerender(<FranchiseRecoveryEditor caseId="7" caseDetail={{}} />);
    expect(screen.queryByText(/Requiere autorización del administrador/)).not.toBeInTheDocument();
  });

  it('explains that repair stays managed by the associated folder when disabled', () => {
    recovery = { id: 7, baseCaseId: 42, baseFolderCode: 'CAR-042', enablesRepair: false };
    render(<FranchiseRecoveryEditor caseId="7" caseDetail={{}} />);
    expect(screen.getByText(/La reparación se gestiona desde la carpeta asociada/)).toBeInTheDocument();
  });
});
