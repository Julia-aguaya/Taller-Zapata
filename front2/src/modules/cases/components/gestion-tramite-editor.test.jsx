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

const mount = (overrides = {}) => render(<GestionTramiteEditor
  caseId={42}
  caseDetail={{ caseTypeCode: 'TODO_RIESGO', ...overrides }}
  budget={{ items: [{ laborAmount: 100000, partValue: 50000 }] }}
  onSaved={vi.fn()}
/>);

describe('GestionTramiteEditor', () => {
  it('renders all 6 sections for TODO_RIESGO', () => {
    mount();
    expect(screen.getByText('Datos generales del trámite')).toBeTruthy();
    expect(screen.getByText('Datos del seguro')).toBeTruthy();
    expect(screen.getByText('Datos del siniestro')).toBeTruthy();
    expect(screen.getByText('Franquicia')).toBeTruthy();
    expect(screen.getByText('Documentación')).toBeTruthy();
    expect(screen.getByText('Tramitación')).toBeTruthy();
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

  it('renders the isolated local CLEAS definition and its pending warning', () => {
    mount({ caseTypeCode: 'CLEAS' });

    expect(screen.getByText('Definición del CLEAS')).toBeTruthy();
    expect(screen.getByText('No se puede avanzar hasta recibir el dictamen.')).toBeTruthy();
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

  it('renders CLEAS in preview mode without changing the other case editor branches', () => {
    render(<GestionTramiteEditor caseId={42} caseDetail={{ caseTypeCode: 'TODO_RIESGO' }} previewCleas budget={null} onSaved={vi.fn()} />);

    expect(screen.getByText('Los campos CLEAS de esta vista son locales y no se guardan.')).toBeTruthy();
    expect(screen.getByText('Definición del CLEAS')).toBeTruthy();
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
