import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GestionTramiteEditor } from './gestion-tramite-editor';

vi.mock('@/shared/api/http-client', () => ({
  requestJson: vi.fn().mockResolvedValue({}),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: undefined, isLoading: false }),
  useMutation: () => ({ isPending: false, mutate: vi.fn() }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/shared/auth/session-storage', () => ({ readStoredAuth: () => ({ userId: '1' }) }));
vi.mock('@/modules/cases/components/documents-section', () => ({
  DocumentsSection: ({ caseId }) => <div data-testid="documents-section" data-case-id={caseId}><h4>Documentación</h4><button type="button">Agregar items</button></div>,
}));
vi.mock('@/modules/cases/components/task-agenda', () => ({
  TaskAgenda: ({ caseId, organizationId, branchId }) => <div data-testid="task-agenda" data-case-id={caseId} data-organization-id={organizationId} data-branch-id={branchId}><h4>Agenda de tareas</h4><button type="button">Agregar item</button></div>,
}));

global.fetch = vi.fn().mockResolvedValue({ ok: true, blob: () => Promise.resolve(new Blob()) });

const MountedGestionTramiteEditor = ({ overrides }) => {
  const [cleasAgreedAmount, setCleasAgreedAmount] = useState('');
  const [cleasOver, setCleasOver] = useState('damage');
  const [cleasOpinion, setCleasOpinion] = useState('favorable');
  const [cleasFranchiseDistribution, setCleasFranchiseDistribution] = useState({ franchiseAmount: '', companyRequirement: 'NO', companyRequiredAmount: '', companyPaymentStatus: 'PENDIENTE', companyPaymentDate: '' });

  return <GestionTramiteEditor
    caseId={42}
    caseDetail={{ caseTypeCode: 'TODO_RIESGO', ...overrides }}
    budget={{ items: [{ laborAmount: 100000, partValue: 50000 }] }}
    cleasAgreedAmount={cleasAgreedAmount}
    setCleasAgreedAmount={setCleasAgreedAmount}
    cleasFranchiseDistribution={cleasFranchiseDistribution}
    onCleasFranchiseDistributionChange={setCleasFranchiseDistribution}
    cleasOver={cleasOver}
    cleasOpinion={cleasOpinion}
    onCleasOverChange={setCleasOver}
    onCleasOpinionChange={setCleasOpinion}
    onSaved={vi.fn()}
  />;
};

const mount = (overrides = {}) => render(<MountedGestionTramiteEditor overrides={overrides} />);

describe('GestionTramiteEditor', () => {
  it('renders all 6 sections for TODO_RIESGO', () => {
    mount();
    expect(screen.getByText('Datos generales del trámite')).toBeTruthy();
    expect(screen.getByText('Datos del seguro')).toBeTruthy();
    expect(screen.getByText('Datos del siniestro')).toBeTruthy();
    expect(screen.getByText('Franquicia')).toBeTruthy();
    expect(screen.getByText('Documentación')).toBeTruthy();
    expect(screen.getByText('Tramitacion')).toBeTruthy();
  });

  it('renders agenda de tareas', () => {
    mount();
    expect(screen.getByText('Agenda de tareas')).toBeTruthy();
  });

  it('hides Franquicia for GRANIZO cases', () => {
    mount({ caseTypeCode: 'GRANIZO' });
    expect(screen.getByText('Datos generales del trámite')).toBeTruthy();
    expect(screen.getByText('Datos del seguro')).toBeTruthy();
    expect(screen.getByText('Datos del siniestro')).toBeTruthy();
    expect(screen.queryByText('Franquicia')).toBeNull();
  });

  it('renders the isolated local CLEAS definition with real-case defaults', () => {
    mount({ caseTypeCode: 'CLEAS' });

    expect(screen.getByText('Definición del CLEAS')).toBeTruthy();
    expect(screen.getByText('CLEAS sobre: Daño total')).toBeTruthy();
    expect(screen.getByText('Dictamen: A favor')).toBeTruthy();
  });

  it('renders CLEAS sections in the required order and passes document and agenda context', () => {
    mount({ caseTypeCode: 'CLEAS', organizationId: 7, branchId: 9 });

    expect(Array.from(screen.getByTestId('cleas-gestion-tramite-editor').querySelectorAll('h4')).map((heading) => heading.textContent)).toEqual([
      'Datos generales del trámite',
      'Definición del CLEAS',
      'Datos del seguro',
      'Datos del siniestro',
      'Documentación',
      'Tramitación',
      'Agenda de tareas',
    ]);
    expect(screen.getByTestId('documents-section')).toHaveAttribute('data-case-id', '42');
    expect(screen.getByTestId('task-agenda')).toHaveAttribute('data-case-id', '42');
    expect(screen.getByTestId('task-agenda')).toHaveAttribute('data-organization-id', '7');
    expect(screen.getByTestId('task-agenda')).toHaveAttribute('data-branch-id', '9');
  });

  it('calculates the unfavorable franchise distribution and preserves signed negative results', () => {
    mount({ caseTypeCode: 'CLEAS' });

    fireEvent.change(screen.getByLabelText('CLEAS sobre'), { target: { value: 'franchise' } });
    fireEvent.change(screen.getAllByLabelText('Dictamen')[0], { target: { value: 'unfavorable' } });
    fireEvent.change(screen.getByLabelText('Monto de cotización acordada'), { target: { value: '2000000' } });
    fireEvent.change(screen.getByLabelText('Monto de franquicia'), { target: { value: '1000000' } });
    fireEvent.change(screen.getByLabelText('¿La Cía. exige pago de franquicia?'), { target: { value: 'PARCIAL' } });
    fireEvent.change(screen.getByLabelText('Monto que la Cía. exige al cliente'), { target: { value: '500000' } });

    expect(screen.getByText('Distribución de la franquicia')).toBeTruthy();
    expect(screen.getByLabelText('A facturar Cía.')).toHaveValue('1500000');
    expect(screen.getByLabelText('A cargo del cliente')).toHaveValue('500000');

    fireEvent.change(screen.getByLabelText('Monto que la Cía. exige al cliente'), { target: { value: '-2500000' } });
    expect(screen.getByLabelText('A facturar Cía.')).toHaveValue('-1500000');
    expect(screen.getByRole('alert')).toHaveTextContent('El importe a facturar a la compañía es negativo. Este caso requiere revisión manual antes de continuar.');
    expect(screen.queryByRole('button', { name: 'Cerrar caso' })).toBeNull();
  });

  it('forces a zero company requirement when the company does not require franchise payment', () => {
    mount({ caseTypeCode: 'CLEAS' });
    fireEvent.change(screen.getByLabelText('CLEAS sobre'), { target: { value: 'franchise' } });
    fireEvent.change(screen.getAllByLabelText('Dictamen')[0], { target: { value: 'unfavorable' } });
    fireEvent.change(screen.getByLabelText('Monto que la Cía. exige al cliente'), { target: { value: '900' } });
    fireEvent.change(screen.getByLabelText('¿La Cía. exige pago de franquicia?'), { target: { value: 'NO' } });

    expect(screen.getByLabelText('Monto que la Cía. exige al cliente')).toHaveValue(0);
    expect(screen.getByLabelText('Monto que la Cía. exige al cliente')).toBeDisabled();
  });

  it('keeps the total company requirement synchronized when the franchise amount changes', () => {
    mount({ caseTypeCode: 'CLEAS' });
    fireEvent.change(screen.getByLabelText('CLEAS sobre'), { target: { value: 'franchise' } });
    fireEvent.change(screen.getAllByLabelText('Dictamen')[0], { target: { value: 'unfavorable' } });
    fireEvent.change(screen.getByLabelText('Monto de cotización acordada'), { target: { value: '2000000' } });
    fireEvent.change(screen.getByLabelText('Monto de franquicia'), { target: { value: '1000000' } });
    fireEvent.change(screen.getByLabelText('¿La Cía. exige pago de franquicia?'), { target: { value: 'TOTAL' } });
    fireEvent.change(screen.getByLabelText('Monto de franquicia'), { target: { value: '1200000' } });

    expect(screen.getByLabelText('Monto que la Cía. exige al cliente')).toHaveValue(1200000);
    expect(screen.getByLabelText('Monto que la Cía. exige al cliente')).toHaveAttribute('readonly');
    expect(screen.getByLabelText('A facturar Cía.')).toHaveValue('2000000');
    expect(screen.getByLabelText('A cargo del cliente')).toHaveValue('0');
  });

  it('keeps the favorable-total billing amount calculated and read-only for CLEAS', () => {
    mount({ caseTypeCode: 'CLEAS' });

    fireEvent.change(screen.getByLabelText('Monto de cotización acordada'), { target: { value: '125' } });

    expect(screen.getByLabelText('A facturar Cía.')).toHaveValue('125');
    expect(screen.getByLabelText('A facturar Cía.')).toHaveAttribute('readonly');
    expect(screen.queryByText('Distribución de la franquicia')).toBeNull();
    expect(screen.queryByLabelText('Monto de franquicia')).toBeNull();
    expect(screen.queryByLabelText('A cargo del cliente')).toBeNull();
  });

  it('keeps a favorable franchise CLEAS billable in full without customer charge or closure', () => {
    mount({ caseTypeCode: 'CLEAS' });

    fireEvent.change(screen.getByLabelText('CLEAS sobre'), { target: { value: 'franchise' } });
    fireEvent.change(screen.getByLabelText('Monto de cotización acordada'), { target: { value: '125000' } });
    fireEvent.change(screen.getByLabelText('Monto de franquicia'), { target: { value: '80000' } });

    expect(screen.getByLabelText('Monto de franquicia')).toHaveValue(80000);
    expect(screen.getByLabelText('Monto de franquicia')).not.toHaveAttribute('readonly');
    expect(screen.getByLabelText('A facturar Cía.')).toHaveValue('125000');
    expect(screen.getByLabelText('A facturar Cía.')).toHaveAttribute('readonly');
    expect(screen.queryByText('Distribución de la franquicia')).toBeNull();
    expect(screen.queryByLabelText('A cargo del cliente')).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Cerrar caso' })).toBeNull();
  });

  it('shows the adverse-total closure alert and request action without franchise amounts', () => {
    mount({ caseTypeCode: 'CLEAS' });

    fireEvent.change(screen.getAllByLabelText('Dictamen')[0], { target: { value: 'unfavorable' } });

    expect(screen.getByRole('alert')).toHaveTextContent('Dictamen en contra');
    expect(screen.getByRole('alert')).toHaveTextContent('El trámite CLEAS no puede continuar. El caso debe cerrarse; el cliente deberá reparar el vehículo por su cuenta o iniciar acciones judiciales.');
    expect(screen.getByRole('button', { name: 'Cerrar caso' })).toBeEnabled();
    expect(screen.queryByLabelText('A facturar Cía.')).toBeNull();
    expect(screen.queryByText('Distribución de la franquicia')).toBeNull();
  });

  it('passes the CLEAS insurance input change to the lifted handler', () => {
    const setNroCleas = vi.fn();
    render(<GestionTramiteEditor caseId={42} caseDetail={{ caseTypeCode: 'CLEAS' }} budget={null} nroCleas="CLEAS-1" setNroCleas={setNroCleas} onSaved={vi.fn()} />);

    expect(screen.getByLabelText('N.º de CLEAS')).toHaveValue('CLEAS-1');
    fireEvent.change(screen.getByLabelText('N.º de CLEAS'), { target: { value: 'CLEAS-2' } });
    expect(setNroCleas).toHaveBeenCalledWith('CLEAS-2');
  });

  it('shows Generar PDF button', () => {
    mount();
    expect(screen.getByText('Generar PDF')).toBeTruthy();
  });

  it('shows Agregar item button for tasks', () => {
    mount();
    expect(screen.getByText('Agregar item')).toBeTruthy();
  });

  it('shows Agregar items button for documents', () => {
    mount();
    expect(screen.getByText('Agregar items')).toBeTruthy();
  });
});
