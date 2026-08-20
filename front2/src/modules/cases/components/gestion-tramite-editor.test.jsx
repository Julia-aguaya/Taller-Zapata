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

global.fetch = vi.fn().mockResolvedValue({ ok: true, blob: () => Promise.resolve(new Blob()) });

const MountedGestionTramiteEditor = ({ overrides }) => {
  const [cleasAgreedAmount, setCleasAgreedAmount] = useState('');

  return <GestionTramiteEditor
    caseId={42}
    caseDetail={{ caseTypeCode: 'TODO_RIESGO', ...overrides }}
    budget={{ items: [{ laborAmount: 100000, partValue: 50000 }] }}
    cleasAgreedAmount={cleasAgreedAmount}
    setCleasAgreedAmount={setCleasAgreedAmount}
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

  it('shows the franchise distribution preview for a rejected CLEAS', () => {
    mount({ caseTypeCode: 'CLEAS' });

    fireEvent.change(screen.getByLabelText('CLEAS sobre'), { target: { value: 'franchise' } });
    fireEvent.change(screen.getAllByLabelText('Dictamen')[0], { target: { value: 'unfavorable' } });
    fireEvent.change(screen.getByLabelText('Monto de cotización acordada'), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText('Monto de franquicia'), { target: { value: '80' } });
    fireEvent.change(screen.getByLabelText('Monto que la Cía. exige al cliente'), { target: { value: '20' } });

    expect(screen.getByText('Distribución de la franquicia')).toBeTruthy();
    expect(screen.getByLabelText('A facturar Cía.')).toHaveValue('40');
    expect(screen.getByLabelText('A cargo del cliente')).toHaveValue('60');
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
