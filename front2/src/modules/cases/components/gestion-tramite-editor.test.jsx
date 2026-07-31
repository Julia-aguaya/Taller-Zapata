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

vi.mock('@/modules/cases/components/documentacion-editor', () => ({
  DocumentacionEditor: () => <div>Documentación panel</div>,
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const mount = () => render(<GestionTramiteEditor
  caseId={42}
  caseDetail={{ caseTypeCode: 'TODO_RIESGO' }}
  budget={{ items: [{ laborAmount: 100000, partValue: 50000 }] }}
  onSaved={vi.fn()}
/>);

describe('GestionTramiteEditor', () => {
  it('renders all 5 sub-tabs', () => {
    mount();
    expect(screen.getAllByText('Datos del Seguro').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Datos del Siniestro').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Franquicia').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Documentación').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Tramitación').length).toBeGreaterThan(0);
  });

  it('shows seguro form by default', () => {
    mount();
    expect(screen.getByText('Compañía, póliza, cobertura y contactos de la cía.')).toBeTruthy();
  });

  it('switches to siniestro tab on click', () => {
    mount();
    fireEvent.click(screen.getByText('Datos del Siniestro'));
    expect(screen.getByText('Fecha de presentación, inspección, modalidad y dictamen.')).toBeTruthy();
  });

  it('switches to franquicia tab on click', () => {
    mount();
    fireEvent.click(screen.getByText('Franquicia'));
    expect(screen.getByText('Estado, monto, recupero y dictamen.')).toBeTruthy();
  });

  it('switches to documentacion tab on click', () => {
    mount();
    fireEvent.click(screen.getByText('Documentación'));
    expect(screen.getByText('Documentación panel')).toBeTruthy();
  });

  it('switches to tramitacion tab and shows sections', () => {
    mount();
    fireEvent.click(screen.getByText('Tramitación'));
    expect(screen.getByText('Cotización')).toBeTruthy();
    expect(screen.getByText('Repuestos')).toBeTruthy();
    expect(screen.getByText('Montos')).toBeTruthy();
  });
});
