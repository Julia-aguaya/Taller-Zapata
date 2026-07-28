import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CasesPageContent } from '@/modules/cases/components/cases-page-content';

const baseItems = [
  {
    id: 1,
    folderCode: 'CAR-001',
    principalCustomerName: 'Ana Uno',
    principalVehiclePlate: 'AA111AA',
    caseTypeCode: 'PARTICULAR',
    currentCaseStateCode: 'EN_TRAMITE',
    currentRepairStateCode: 'SIN_TURNO',
    currentPaymentStateCode: 'PENDIENTE',
    visibleTramiteState: { code: 'EN_TRAMITE', label: 'En tramite' },
    visibleRepairState: { code: 'DAR_TURNO', label: 'Dar turno' },
    createdAt: '2026-02-10T08:00:00Z',
    closedAt: null,
    branchId: 1,
    branchCode: 'Z',
  },
  {
    id: 2,
    folderCode: 'CAR-002',
    principalCustomerName: 'Beto Dos',
    principalVehiclePlate: 'BB222BB',
    caseTypeCode: 'TODO_RIESGO',
    currentCaseStateCode: 'CERRADO',
    currentRepairStateCode: 'REPARADO',
    currentPaymentStateCode: 'PAGADO',
    visibleTramiteState: { code: 'PAGADO', label: 'Pagado' },
    visibleRepairState: { code: 'REPARADO', label: 'Reparado' },
    createdAt: '2026-03-05T08:00:00Z',
    closedAt: '2026-03-20T10:00:00Z',
    branchId: 2,
    branchCode: 'C',
  },
];

const defaultProps = {
  items: baseItems,
  totalCount: 2,
  caseTypes: [
    { code: 'PARTICULAR', name: 'Particular' },
    { code: 'TODO_RIESGO', name: 'Todo Riesgo' },
  ],
  insuranceCatalogs: {
    opinionCodes: [
      { code: 'APROBADO', name: 'Aprobado' },
    ],
    paymentStatusCodes: [
      { code: 'PENDIENTE', name: 'Pendiente' },
      { code: 'PAGADO', name: 'Pagado' },
    ],
  },
  pendingTasks: [
    { id: 10, caseId: 1, assignedUserId: 7, statusCode: 'PENDIENTE', resolved: false },
  ],
  onApplyFilters: vi.fn(),
  onOpenCase: vi.fn(),
};

function renderView(props = {}) {
  return render(<CasesPageContent {...defaultProps} {...props} />);
}

function getSelectOptions(label) {
  return Array.from(screen.getByLabelText(label).querySelectorAll('option')).map((option) => option.textContent);
}

function expectRenderedResultsLabel(label) {
  expect(screen.getByText(label)).toBeInTheDocument();
}

describe('CasesPageContent', () => {
  it('filtra por carpeta, cliente y dominio desde la barra principal', async () => {
    const user = userEvent.setup();
    const { rerender } = renderView();

    await user.type(screen.getByLabelText('Buscar carpeta, cliente o dominio'), 'CAR-001');
    await user.click(screen.getByRole('button', { name: 'Aplicar filtros' }));

    expectRenderedResultsLabel('1 de 2 carpetas');
    expect(screen.getByText('CAR-001')).toBeInTheDocument();
    expect(screen.queryByText('CAR-002')).not.toBeInTheDocument();

    rerender(<CasesPageContent {...defaultProps} />);

    await user.clear(screen.getByLabelText('Buscar carpeta, cliente o dominio'));
    await user.type(screen.getByLabelText('Buscar carpeta, cliente o dominio'), 'Beto');
    await user.click(screen.getByRole('button', { name: 'Aplicar filtros' }));

    expectRenderedResultsLabel('1 de 2 carpetas');
    expect(screen.getByText('CAR-002')).toBeInTheDocument();

    rerender(<CasesPageContent {...defaultProps} />);

    await user.clear(screen.getByLabelText('Buscar carpeta, cliente o dominio'));
    await user.type(screen.getByLabelText('Buscar carpeta, cliente o dominio'), 'AA111');
    await user.click(screen.getByRole('button', { name: 'Aplicar filtros' }));

    expectRenderedResultsLabel('1 de 2 carpetas');
    expect(screen.getByText('CAR-001')).toBeInTheDocument();
  });

  it('aplica filtros soportados por backend con un unico boton de confirmacion', async () => {
    const user = userEvent.setup();
    const onApplyFilters = vi.fn();
    renderView({ onApplyFilters });

    await user.type(screen.getByLabelText('Buscar carpeta, cliente o dominio'), 'BB222BB');
    await user.click(screen.getByRole('button', { name: 'Filtros avanzados' }));
    await user.selectOptions(screen.getByLabelText('Trámite'), 'TODO_RIESGO');
    await user.selectOptions(screen.getByLabelText('Dictamen'), 'APROBADO');
    await user.type(screen.getByLabelText('Gestor'), 'ABOGADO');
    await user.selectOptions(screen.getByLabelText('Estado del trámite'), 'PAGADO');
    await user.selectOptions(screen.getByLabelText('Estado de reparación'), 'REPARADO');
    await user.selectOptions(screen.getByLabelText('Estado de pago'), 'PAGADO');
    await user.selectOptions(screen.getByLabelText('Tareas pendientes'), 'true');
    await user.type(screen.getByLabelText('Responsable'), '7');
    await user.type(screen.getByLabelText('Alta desde'), '2026-02-01');
    await user.type(screen.getByLabelText('Alta hasta'), '2026-03-31');
    await user.type(screen.getByLabelText('Pago desde'), '2026-03-01');
    await user.type(screen.getByLabelText('Pago hasta'), '2026-03-31');

    expect(onApplyFilters).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Aplicar filtros' }));

    expect(onApplyFilters).toHaveBeenLastCalledWith({
      q: 'BB222BB',
      openedFrom: '2026-02-01',
      openedTo: '2026-03-31',
      paidFrom: '2026-03-01',
      paidTo: '2026-03-31',
      caseTypeCode: 'TODO_RIESGO',
      opinionCode: 'APROBADO',
      managerCode: 'ABOGADO',
      visibleTramiteState: 'PAGADO',
      visibleRepairState: 'REPARADO',
      paymentStateCode: 'PAGADO',
      hasPendingTasks: true,
      pendingTaskAssignedUserId: 7,
    });
  });

  it('filtra localmente por estado del tramite, remueve chips y actualiza contador', async () => {
    const user = userEvent.setup();
    renderView();

    await user.selectOptions(screen.getByLabelText('Estado del trámite'), 'EN_TRAMITE');
    await user.click(screen.getByRole('button', { name: 'Aplicar filtros' }));

    expectRenderedResultsLabel('1 de 2 carpetas');
    expect(screen.getByText('CAR-001')).toBeInTheDocument();
    expect(screen.queryByText('CAR-002')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Quitar filtro Estado del trámite: En tramite' }));

    expectRenderedResultsLabel('2 carpetas');
    expect(screen.getByText('CAR-001')).toBeInTheDocument();
    expect(screen.getByText('CAR-002')).toBeInTheDocument();
  });

  it('mantiene opciones de sucursal y otros selects aunque los resultados ya vengan filtrados', async () => {
    const user = userEvent.setup();
    const onApplyFilters = vi.fn();
    const { rerender } = renderView({ onApplyFilters, filterSourceItems: baseItems });

    await user.click(screen.getByRole('button', { name: 'Filtros avanzados' }));

    expect(getSelectOptions('Sucursal')).toEqual(['Todas', 'C', 'Z']);
    expect(getSelectOptions('Estado del trámite')).toEqual(['Todos', 'En tramite', 'Pagado']);
    expect(getSelectOptions('Estado de reparación')).toEqual(['Todos', 'Dar turno', 'Reparado']);

    await user.selectOptions(screen.getByLabelText('Sucursal'), '1');
    await user.click(screen.getByRole('button', { name: 'Aplicar filtros' }));

    rerender(<CasesPageContent {...defaultProps} items={[baseItems[0]]} totalCount={2} filterSourceItems={baseItems} onApplyFilters={onApplyFilters} />);

    await user.click(screen.getByRole('button', { name: 'Filtros avanzados · 1' }));

    expect(getSelectOptions('Sucursal')).toEqual(['Todas', 'C', 'Z']);
    expect(screen.getByLabelText('Sucursal')).toHaveValue('1');

    await user.selectOptions(screen.getByLabelText('Sucursal'), '2');
    await user.click(screen.getByRole('button', { name: 'Aplicar filtros' }));

    expect(onApplyFilters).toHaveBeenLastCalledWith({ branchId: 2 });

    rerender(<CasesPageContent {...defaultProps} items={baseItems} totalCount={2} filterSourceItems={baseItems} onApplyFilters={onApplyFilters} />);

    await user.click(screen.getByRole('button', { name: 'Limpiar filtros' }));
    await user.click(screen.getByRole('button', { name: 'Filtros avanzados' }));

    expect(screen.getByLabelText('Sucursal')).toHaveValue('');
  });

  it('conserva los valores visibles al aplicar, cerrar, rerenderizar resultados y limpiar recien al final', async () => {
    const user = userEvent.setup();
    const onApplyFilters = vi.fn();
    const { rerender } = renderView({ onApplyFilters, filterSourceItems: baseItems });

    expect(screen.getByRole('button', { name: 'Filtros avanzados' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('button', { name: 'Limpiar filtros' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Filtros avanzados' }));
    await user.selectOptions(screen.getByLabelText('Sucursal'), '1');
    await user.click(screen.getByRole('button', { name: 'Aplicar filtros' }));

    rerender(<CasesPageContent {...defaultProps} items={[baseItems[0]]} totalCount={2} filterSourceItems={baseItems} onApplyFilters={onApplyFilters} />);

    expect(screen.getByRole('button', { name: 'Filtros avanzados · 1' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('button', { name: 'Limpiar filtros' })).toBeEnabled();
    expect(onApplyFilters).toHaveBeenLastCalledWith({ branchId: 1 });

    await user.click(screen.getByRole('button', { name: 'Filtros avanzados · 1' }));

    expect(screen.getByLabelText('Sucursal')).toHaveValue('1');
    expect(getSelectOptions('Sucursal')).toEqual(['Todas', 'C', 'Z']);

    await user.click(screen.getByRole('button', { name: 'Limpiar filtros' }));

    expect(screen.getByRole('button', { name: 'Filtros avanzados' })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: 'Filtros avanzados' }));

    expect(screen.getByLabelText('Sucursal')).toHaveValue('');
  });

  it('mantiene seleccionados los filtros aunque cambien items y catalogos en un rerender', async () => {
    const user = userEvent.setup();
    const onApplyFilters = vi.fn();
    const expandedInsuranceCatalogs = {
      ...defaultProps.insuranceCatalogs,
      paymentStatusCodes: [
        ...defaultProps.insuranceCatalogs.paymentStatusCodes,
        { code: 'RECHAZADO', name: 'Rechazado' },
      ],
    };

    const { rerender } = renderView({ onApplyFilters, filterSourceItems: baseItems });

    await user.click(screen.getByRole('button', { name: 'Filtros avanzados' }));
    await user.selectOptions(screen.getByLabelText('Sucursal'), '1');
    await user.selectOptions(screen.getByLabelText('Estado de pago'), 'PAGADO');
    await user.click(screen.getByRole('button', { name: 'Aplicar filtros' }));

    rerender(
      <CasesPageContent
        {...defaultProps}
        items={[baseItems[0]]}
        totalCount={3}
        filterSourceItems={[
          ...baseItems,
          {
            ...baseItems[0],
            id: 3,
            folderCode: 'CAR-003',
            branchId: 3,
            branchCode: 'N',
            currentPaymentStateCode: 'RECHAZADO',
          },
        ]}
        insuranceCatalogs={expandedInsuranceCatalogs}
        onApplyFilters={onApplyFilters}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Filtros avanzados · 2' }));

    expect(screen.getByLabelText('Sucursal')).toHaveValue('1');
    expect(screen.getByLabelText('Estado de pago')).toHaveValue('PAGADO');
    expect(getSelectOptions('Sucursal')).toEqual(['Todas', 'C', 'N', 'Z']);
    expect(getSelectOptions('Estado de pago')).toEqual(['Todos', 'Pagado', 'Pendiente', 'Rechazado']);
  });

  it('permite cerrar mas filtros con filtros activos, conserva valores y hace scroll al listado al aplicar', async () => {
    const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const getBoundingClientRectSpy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function mockRect() {
      if (this.getAttribute?.('aria-hidden') === 'true') {
        return { top: 420, left: 0, right: 0, bottom: 420, width: 0, height: 0, x: 0, y: 420, toJSON: () => ({}) };
      }

      return { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) };
    });

    const user = userEvent.setup();
    renderView({ filterSourceItems: baseItems });

    await user.click(screen.getByRole('button', { name: 'Filtros avanzados' }));
    await user.selectOptions(screen.getByLabelText('Sucursal'), '1');
    await user.click(screen.getByRole('button', { name: 'Aplicar filtros' }));

    expectRenderedResultsLabel('1 de 2 carpetas');
    expect(screen.getByText('CAR-001')).toBeInTheDocument();
    expect(screen.queryByText('CAR-002')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Filtros avanzados · 1' })).toHaveAttribute('aria-expanded', 'false');
    expect(scrollToSpy).toHaveBeenLastCalledWith({ top: 308, behavior: 'smooth' });

    await user.click(screen.getByRole('button', { name: 'Filtros avanzados · 1' }));

    expect(screen.getByLabelText('Sucursal')).toHaveValue('1');
    expect(screen.getByRole('button', { name: 'Filtros avanzados · 1' })).toHaveAttribute('aria-expanded', 'true');

    await user.click(screen.getByRole('button', { name: 'Filtros avanzados · 1' }));

    expect(screen.getByRole('button', { name: 'Filtros avanzados · 1' })).toHaveAttribute('aria-expanded', 'false');

    scrollToSpy.mockRestore();
    getBoundingClientRectSpy.mockRestore();
  });

  it('permite limpiar todos los filtros y salir del estado vacio', async () => {
    const user = userEvent.setup();
    renderView();

    await user.selectOptions(screen.getByLabelText('Estado del trámite'), 'EN_TRAMITE');
    await user.selectOptions(screen.getByLabelText('Estado de reparación'), 'REPARADO');
    await user.click(screen.getByRole('button', { name: 'Aplicar filtros' }));

    expectRenderedResultsLabel('0 de 2 carpetas');
    expect(screen.getByText('No hay carpetas para esos filtros')).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: 'Limpiar filtros' })[0]);

    expectRenderedResultsLabel('2 carpetas');
    expect(screen.getByText('CAR-001')).toBeInTheDocument();
    expect(screen.getByText('CAR-002')).toBeInTheDocument();
  });

  it('bloquea la aplicacion cuando el rango de fechas es invalido', async () => {
    const user = userEvent.setup();
    const onApplyFilters = vi.fn();
    renderView({ onApplyFilters });

    await user.click(screen.getByRole('button', { name: 'Filtros avanzados' }));
    await user.type(screen.getByLabelText('Alta desde'), '2026-04-10');
    await user.type(screen.getByLabelText('Alta hasta'), '2026-04-01');
    await user.click(screen.getByRole('button', { name: 'Aplicar filtros' }));

    expect(screen.getByRole('alert')).toHaveTextContent('rango de alta es invalido');
    expect(onApplyFilters).not.toHaveBeenCalled();
  });

  it('evita mostrar nombres falsos para gestor y responsable', async () => {
    const user = userEvent.setup();
    renderView();

    await user.click(screen.getByRole('button', { name: 'Filtros avanzados' }));

    expect(screen.getByPlaceholderText('Código exacto del gestor')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('ID exacto del responsable')).toBeInTheDocument();
    expect(screen.getByText('Por ahora se filtra por código, sin inventar nombres.')).toBeInTheDocument();
    expect(screen.getByText('Todavía no hay nombres visibles para responsables; podés filtrar por ID exacto.')).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'ID 7' })).not.toBeInTheDocument();
  });
});
