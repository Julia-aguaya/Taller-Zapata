import { describe, expect, it } from 'vitest';
import {
  applyLocalCaseFilters,
  buildBackendCaseFilters,
  buildCaseFilterOptions,
  buildPendingTaskIndex,
  getRenderedResultsLabel,
  validateCaseFilters,
} from '@/modules/cases/lib/cases-filters';

const items = [
  {
    id: 1,
    folderCode: 'CAR-001',
    principalCustomerName: 'Ana Uno',
    principalVehiclePlate: 'AA111AA',
    orderNumber: 1001,
    caseTypeCode: 'PARTICULAR',
    branchId: 1,
    branchCode: 'Z',
    currentCaseStateCode: 'EN_TRAMITE',
    currentRepairStateCode: 'SIN_TURNO',
    currentPaymentStateCode: 'PENDIENTE',
    visibleTramiteState: { code: 'EN_TRAMITE', label: 'En tramite' },
    visibleRepairState: { code: 'DAR_TURNO', label: 'Dar turno' },
    closedAt: null,
    archivedAt: null,
  },
  {
    id: 2,
    folderCode: 'CAR-002',
    principalCustomerName: 'Beto Dos',
    principalVehiclePlate: 'BB222BB',
    orderNumber: 1002,
    caseTypeCode: 'TODO_RIESGO',
    branchId: 2,
    branchCode: 'C',
    currentCaseStateCode: 'CERRADO',
    currentRepairStateCode: 'REPARADO',
    currentPaymentStateCode: 'PAGADO',
    visibleTramiteState: { code: 'PAGADO', label: 'Pagado' },
    visibleRepairState: { code: 'REPARADO', label: 'Reparado' },
    closedAt: '2026-03-20T10:00:00Z',
    archivedAt: null,
  },
  {
    id: 3,
    folderCode: 'CAR-003',
    principalCustomerName: 'Carla Tres',
    principalVehiclePlate: 'CC333CC',
    orderNumber: 1003,
    caseTypeCode: 'TODO_RIESGO',
    branchId: 1,
    branchCode: 'Z',
    currentCaseStateCode: 'EN_TRAMITE',
    currentRepairStateCode: 'SIN_TURNO',
    currentPaymentStateCode: 'PENDIENTE',
    visibleTramiteState: { code: 'EN_TRAMITE', label: 'En tramite' },
    visibleRepairState: { code: 'DAR_TURNO', label: 'Dar turno' },
    closedAt: null,
    archivedAt: '2026-03-22T10:00:00Z',
  },
];

const pendingTasks = [
  { id: 10, caseId: 1, assignedUserId: 7, statusCode: 'PENDIENTE', resolved: false },
  { id: 11, caseId: 2, assignedUserId: 9, statusCode: 'RESUELTA', resolved: true },
  { id: 12, caseId: 3, assignedUserId: 8, statusCode: 'PENDIENTE', resolved: false },
];

describe('cases-filters', () => {
  it('serializa los filtros soportados por backend', () => {
    expect(buildBackendCaseFilters({
      q: 'AA111AA',
      folderStatus: 'ABIERTA',
      branchId: '3',
      openedFrom: '2026-02-01',
      openedTo: '2026-02-28',
      paidFrom: '2026-03-01',
      paidTo: '2026-03-31',
      caseTypeCode: 'TODO_RIESGO',
      opinionCode: 'APROBADO',
      managerCode: 'ABOGADO',
      visibleTramiteState: 'PAGADO',
      visibleRepairState: 'REPARADO',
      paymentStateCode: 'PAGADO',
      hasPendingTasks: 'false',
      pendingTaskAssignedUserId: '7',
    })).toEqual({
      q: 'AA111AA',
      folderStatus: 'ABIERTA',
      branchId: 3,
      openedFrom: '2026-02-01',
      openedTo: '2026-02-28',
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

  it('detecta rangos de fechas invalidos', () => {
    expect(validateCaseFilters({ openedFrom: '2026-04-10', openedTo: '2026-04-01' }))
      .toContain('rango de alta es invalido');

    expect(validateCaseFilters({ paidFrom: '2026-05-10', paidTo: '2026-05-01' }))
      .toContain('rango de pago es invalido');
  });

  it('construye opciones reales desde items, catalogos y tareas', () => {
    const options = buildCaseFilterOptions({
      items,
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
        { id: 11, caseId: 2, assignedUserId: 9, statusCode: 'RESUELTA', resolved: true },
      ],
    });

    expect(options.folderStatuses).toEqual([
      { value: 'ABIERTA', label: 'Abierta' },
      { value: 'CERRADA', label: 'Cerrada' },
      { value: 'ARCHIVADA', label: 'Archivada' },
    ]);
    expect(options.currentCaseStates.map((item) => item.value)).toEqual(['CERRADO', 'EN_TRAMITE']);
    expect(options.currentRepairStates.map((item) => item.value)).toEqual(['REPARADO', 'SIN_TURNO']);
    expect(options.paymentStates).toEqual([
      { value: 'PAGADO', label: 'Pagado' },
      { value: 'PENDIENTE', label: 'Pendiente' },
    ]);
    expect(options.opinions).toEqual([{ value: 'APROBADO', label: 'Aprobado' }]);
    expect(options.pendingTaskAssignees).toEqual([]);
    expect(options.managers).toEqual([]);
    expect(options.caseTypes).toEqual([
      { value: 'PARTICULAR', label: 'Particular' },
      { value: 'TODO_RIESGO', label: 'Todo Riesgo' },
    ]);
  });

  it('mantiene tipos reales desde la coleccion base aunque el catalogo no los traiga', () => {
    const options = buildCaseFilterOptions({
      items,
      caseTypes: [{ code: 'PARTICULAR', name: 'Particular' }],
    });

    expect(options.caseTypes).toEqual([
      { value: 'PARTICULAR', label: 'Particular' },
      { value: 'TODO_RIESGO', label: 'Todo Riesgo' },
    ]);
  });

  it('prepara opciones reales para gestor y responsable solo cuando llegan labels visibles', () => {
    const options = buildCaseFilterOptions({
      items: [{ managerCode: 'GESTOR_1', managerLabel: 'Lucia Perez' }],
      pendingTasks: [{ id: 10, caseId: 1, assignedUserId: 7, assignedUserDisplayName: 'Juan Gomez', statusCode: 'PENDIENTE', resolved: false }],
    });

    expect(options.managers).toEqual([{ value: 'GESTOR_1', label: 'Lucia Perez' }]);
    expect(options.pendingTaskAssignees).toEqual([{ value: '7', label: 'Juan Gomez' }]);
  });

  it('filtra localmente por busqueda de carpeta, cliente y dominio', () => {
    expect(applyLocalCaseFilters(items, { q: 'CAR-002' }).map((item) => item.id)).toEqual([2]);
    expect(applyLocalCaseFilters(items, { q: 'Ana' }).map((item) => item.id)).toEqual([1]);
    expect(applyLocalCaseFilters(items, { q: 'CC333' }).map((item) => item.id)).toEqual([3]);
  });

  it('filtra localmente por estado de carpeta, tramite, reparacion y pago', () => {
    expect(applyLocalCaseFilters(items, { folderStatus: 'ABIERTA' }).map((item) => item.id)).toEqual([1]);
    expect(applyLocalCaseFilters(items, { folderStatus: 'CERRADA' }).map((item) => item.id)).toEqual([2]);
    expect(applyLocalCaseFilters(items, { folderStatus: 'ARCHIVADA' }).map((item) => item.id)).toEqual([3]);
    expect(applyLocalCaseFilters(items, { currentCaseStateCode: 'EN_TRAMITE' }).map((item) => item.id)).toEqual([1, 3]);
    expect(applyLocalCaseFilters(items, { currentRepairStateCode: 'REPARADO' }).map((item) => item.id)).toEqual([2]);
    expect(applyLocalCaseFilters(items, { paymentStateCode: 'PAGADO' }).map((item) => item.id)).toEqual([2]);
  });

  it('filtra localmente por tramite, estados visibles y tareas pendientes', () => {
    const pendingTaskIndex = buildPendingTaskIndex(pendingTasks);

    expect(applyLocalCaseFilters(items, { caseTypeCode: 'TODO_RIESGO' }).map((item) => item.id)).toEqual([2, 3]);
    expect(applyLocalCaseFilters(items, { visibleTramiteState: 'PAGADO' }).map((item) => item.id)).toEqual([2]);
    expect(applyLocalCaseFilters(items, { visibleRepairState: 'DAR_TURNO' }).map((item) => item.id)).toEqual([1, 3]);
    expect(applyLocalCaseFilters(items, { hasPendingTasks: 'true' }, { pendingTaskIndex }).map((item) => item.id)).toEqual([1, 3]);
    expect(applyLocalCaseFilters(items, { hasPendingTasks: 'false' }, { pendingTaskIndex }).map((item) => item.id)).toEqual([2]);
    expect(applyLocalCaseFilters(items, { pendingTaskAssignedUserId: '8' }, { pendingTaskIndex }).map((item) => item.id)).toEqual([3]);
  });

  it('combina filtros locales sin desalinear resultados', () => {
    const pendingTaskIndex = buildPendingTaskIndex(pendingTasks);

    expect(applyLocalCaseFilters(items, {
      q: 'car',
      currentCaseStateCode: 'EN_TRAMITE',
      currentRepairStateCode: 'SIN_TURNO',
      caseTypeCode: 'PARTICULAR',
      visibleRepairState: 'DAR_TURNO',
      hasPendingTasks: 'true',
      pendingTaskAssignedUserId: '7',
    }, { pendingTaskIndex }).map((item) => item.id)).toEqual([1]);
  });

  it('muestra un contador honesto cuando no hay total general confiable', () => {
    expect(getRenderedResultsLabel(2, undefined, false)).toBe('2 carpetas');
    expect(getRenderedResultsLabel(1, undefined, true)).toBe('1 carpeta');
    expect(getRenderedResultsLabel(1, 3, true)).toBe('1 de 3 carpetas');
  });
});
