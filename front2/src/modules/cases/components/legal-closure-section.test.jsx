import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LegalClosureSection } from './legal-closure-section';

const fetchMock = vi.fn();
let closingDocumentsProps;
vi.stubGlobal('fetch', fetchMock);
vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:expenses'), revokeObjectURL: vi.fn() });
vi.mock('@tanstack/react-query', () => ({ useQuery: ({ queryKey }) => ({ data: queryKey.at(-1) === 'legal-expenses' ? [{ id: 1, concept: 'Tasa', amount: 100, expenseDate: '2026-03-01', paidByCode: 'CLIENTE' }] : [] }), useMutation: ({ mutationFn, onSuccess }) => ({ isPending: false, mutate: async (value) => onSuccess?.(await mutationFn(value)) }), useQueryClient: () => ({ invalidateQueries: vi.fn() }) }));
vi.mock('@/modules/cases/api/third-party-api', () => ({ createLegalExpense: vi.fn(), createLegalRecoverable: vi.fn(), deleteLegalExpense: vi.fn(), deleteLegalRecoverable: vi.fn(), getLegalExpenses: vi.fn(), getLegalExpensesExportUrl: () => '/cases/42/legal-expenses/export', getLegalRecoverables: vi.fn(), saveLegalCase: vi.fn(), updateLegalExpense: vi.fn(), updateLegalRecoverable: vi.fn() }));
vi.mock('@/modules/cases/components/documents-section', () => ({ DocumentsSection: (props) => { closingDocumentsProps = props; return <div>Documentación de cierre</div>; } }));
vi.mock('@/shared/auth/session-storage', () => ({ readStoredAuth: () => ({ accessToken: 'token-test' }) }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

describe('LegalClosureSection', () => {
  it('downloads the current case expense export with the stored JWT', async () => {
    fetchMock.mockResolvedValue({ ok: true, blob: vi.fn().mockResolvedValue(new Blob(['xlsx'])) });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    render(<LegalClosureSection caseId={42} legal={{ closedByCode: 'PENDIENTE' }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Exportar Excel' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/v1/cases/42/legal-expenses/export', { headers: { Authorization: 'Bearer token-test' } }));
    expect(click).toHaveBeenCalled();
    click.mockRestore();
  });

  it('renders expenses, closure, rubros, notes, and closing documents in that order', () => {
    render(<LegalClosureSection caseId={42} legal={{ closedByCode: 'PENDIENTE' }} />);
    const orderedSections = ['Planilla de gastos', 'Datos de cierre', 'Detalle de rubros', 'Anotaciones', 'Documentación de cierre'].map((label) => screen.getByLabelText(label));
    orderedSections.slice(1).forEach((section, index) => expect(orderedSections[index].compareDocumentPosition(section) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy());
  });

  it('isolates closing documents to the legal closing category', () => {
    render(<LegalClosureSection caseId={42} legal={{ closedByCode: 'PENDIENTE' }} />);

    expect(closingDocumentsProps).toEqual(expect.objectContaining({
      caseId: 42,
      moduleCode: 'LEGAL',
      categoryCodes: new Set(['CIERRE_LEGAL']),
      title: 'Documentación de cierre',
    }));
  });

  it('uses shadcn controls for closure, expense payer, and workshop amount', () => {
    render(<LegalClosureSection caseId={42} legal={{ closedByCode: 'PENDIENTE' }} />);

    expect(screen.getByRole('combobox', { name: 'Cierre por' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Agregar gasto' }));
    expect(screen.getByRole('dialog', { name: 'Agregar gasto' }).querySelector('[aria-label="Abonó gasto"]')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar diálogo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Agregar rubro' }));
    expect(screen.getByRole('dialog', { name: 'Agregar rubro' }).querySelector('[aria-label="Suma al taller rubro"]')).toBeTruthy();
  });

  it('only renders legal close date and total after selecting a definitive closure code', () => {
    render(<LegalClosureSection caseId={42} legal={{ closedByCode: 'PENDIENTE' }} />);

    expect(screen.queryByLabelText('Fecha de cierre')).toBeNull();
    expect(screen.queryByLabelText('Importe total')).toBeNull();
    fireEvent.click(screen.getByRole('combobox', { name: 'Cierre por' }));
    fireEvent.click(screen.getByRole('option', { name: 'CONCILIACION' }));
    expect(screen.getByLabelText('Fecha de cierre')).toBeEnabled();
    expect(screen.getByLabelText('Importe total')).toBeEnabled();
  });

  it('keeps expense and rubro forms inside their respective dialogs', () => {
    render(<LegalClosureSection caseId={42} legal={{ closedByCode: 'PENDIENTE' }} />);

    expect(screen.queryByLabelText('Concepto de gasto')).toBeNull();
    expect(screen.queryByLabelText('Concepto de rubro')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Agregar gasto' }));
    expect(screen.getByRole('dialog', { name: 'Agregar gasto' })).toContainElement(screen.getByLabelText('Concepto de gasto'));
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar diálogo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Agregar rubro' }));
    expect(screen.getByRole('dialog', { name: 'Agregar rubro' })).toContainElement(screen.getByLabelText('Concepto de rubro'));
  });
});
