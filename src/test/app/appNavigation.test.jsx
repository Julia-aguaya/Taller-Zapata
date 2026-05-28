import { describe, expect, it } from 'vitest';
import { getCaseHash } from '../../features/routing/lib/caseHash';

import {
  getGestionEntryTarget,
  resolveGestionAccess,
  resolveOpenCasePayload,
  resolvePanelOpenCaseTarget,
  resolveSelectedCaseById,
  shouldPreserveGestionHash,
  shouldPromptRepairAccess,
  shouldOpenDocumentationGate,
  shouldForceAuthReset,
} from '../../App';
import {
  createBudgetDefaults,
  createLawyerDefaults,
  createThirdPartyDefaults,
  createTodoRiskDefaults,
} from '../../features/cases/lib/caseFactories';

describe('App navigation helpers', () => {
  it('abre una carpeta por defecto en Ficha Técnica', () => {
    expect(getGestionEntryTarget({})).toEqual({ tab: 'ficha' });
  });

  it('abre reclamo de tercero abogado en Ficha Técnica primero', () => {
    expect(getGestionEntryTarget({ caseTypeCode: 'RECLAMO_TERCEROS_ABOGADO' })).toEqual({ tab: 'ficha' });
  });

  it('abre reclamo de tercero abogado hidratado en Ficha Técnica primero', () => {
    expect(getGestionEntryTarget({ tramiteType: 'Reclamo de Tercero - Abogado' })).toEqual({ tab: 'ficha' });
  });

  it('resuelve acceso abogado desde Panel general -> Ver carpeta con payload backend', () => {
    const backendItem = { id: 77, caseTypeCode: 'RECLAMO_TERCEROS_ABOGADO' };
    const target = getGestionEntryTarget(backendItem);

    expect(target).toEqual({ tab: 'ficha' });
    expect(resolveGestionAccess(backendItem, target)).toEqual({ tab: 'ficha', subtab: '' });
  });

  it('resuelve acceso abogado desde Seccion Carpetas -> abrir carpeta via detalle', () => {
    const backendItem = { id: 99, caseTypeCode: 'RECLAMO_TERCEROS_ABOGADO' };

    expect(resolveGestionAccess(backendItem, { tab: 'gestion' })).toEqual({ tab: 'gestion', subtab: 'repuestos' });
  });

  it('normaliza openCase cuando llega payload parcial de panel para caso abogado', () => {
    const payload = { caseId: 451, caseTypeCode: 'RECLAMO_TERCEROS_ABOGADO' };

    expect(resolveOpenCasePayload(payload, { tab: 'gestion' })).toEqual({
      id: '451',
      item: payload,
      target: { tab: 'gestion', subtab: 'repuestos' },
    });
  });

  it('normaliza openCase cuando target viene invalido o inconsistente', () => {
    const payload = { id: 87 };

    expect(resolveOpenCasePayload(payload, { tab: 'cualquier-cosa', subtab: 'x' })).toEqual({
      id: '87',
      item: payload,
      target: { tab: 'ficha', subtab: '' },
    });
  });

  it('panel general -> abrir carpeta abogado fuerza Ficha Técnica y hash nunca queda en root', () => {
    const panelItem = { id: 451, caseTypeCode: 'RECLAMO_TERCEROS_ABOGADO' };
    const target = resolvePanelOpenCaseTarget(panelItem, { tab: 'gestion' });
    const payload = resolveOpenCasePayload(panelItem, target);
    const hash = getCaseHash(payload.id, payload.target);

    expect(target).toEqual({ tab: 'ficha' });
    expect(payload.target).toEqual({ tab: 'ficha', subtab: '' });
    expect(hash).toBe('#/caso/451/ficha');
    expect(hash).not.toBe('/');
  });

  it('preserva hash de abogado inmediatamente despues de abrir carpeta', () => {
    const now = 2_000;
    expect(shouldPreserveGestionHash('panel', '#/caso/451/abogado', now - 500, now)).toBe(true);
    expect(shouldPreserveGestionHash('panel', '#/caso/451/abogado', now - 2_000, now)).toBe(false);
    expect(shouldPreserveGestionHash('panel', '#/caso/451/ficha', now - 500, now)).toBe(false);
  });

  it('solo pide confirmacion al entrar a Gestión de reparación con warning operativo', () => {
    const warnedCase = {
      computed: {
        todoRisk: {
          turnWarningRequired: true,
        },
      },
    };

    expect(shouldPromptRepairAccess(warnedCase, { tab: 'gestion' })).toBe(true);
    expect(shouldPromptRepairAccess(warnedCase, { tab: 'gestion' }, { source: 'open-case' })).toBe(false);
    expect(shouldPromptRepairAccess(warnedCase, { tab: 'ficha' })).toBe(false);
    expect(shouldPromptRepairAccess({}, { tab: 'gestion' })).toBe(false);
  });

  it('excluye abogado del warning al entrar a reparación y lo mantiene en no abogado', () => {
    const warnedNonLawyerCase = {
      tramiteType: 'Todo Riesgo',
      computed: {
        todoRisk: {
          turnWarningRequired: true,
        },
      },
    };
    const warnedLawyerCase = {
      tramiteType: 'Reclamo de Tercero - Abogado',
      computed: {
        todoRisk: {
          turnWarningRequired: true,
        },
      },
    };

    expect(shouldPromptRepairAccess(warnedNonLawyerCase, { tab: 'gestion' })).toBe(true);
    expect(shouldPromptRepairAccess(warnedLawyerCase, { tab: 'gestion' })).toBe(false);
  });

  it('no deja que documentacion pise el warning de reparacion durante click de tab', () => {
    const warnedLawyerCase = {
      id: '451',
      tramiteType: 'Reclamo de Tercero - Abogado',
      thirdParty: {
        claim: {
          documentationStatus: 'Incompleta',
        },
      },
      computed: {
        todoRisk: {
          turnWarningRequired: true,
        },
      },
    };

    expect(shouldOpenDocumentationGate({
      activeView: 'gestion',
      selectedCase: warnedLawyerCase,
      docGateAcceptedCaseId: '',
      repairAccessPrompt: { mode: 'tab', resolvedTarget: { tab: 'gestion', subtab: 'repuestos' } },
      activeTab: 'abogado',
    })).toBe(false);
  });

  it('mantiene gate de documentacion fuera del evento de ingreso a reparacion', () => {
    const pendingDocCase = {
      id: '901',
      tramiteType: 'Reclamo de Tercero - Taller',
      thirdParty: {
        claim: {
          documentationStatus: 'Incompleta',
        },
      },
    };

    expect(shouldOpenDocumentationGate({
      activeView: 'gestion',
      selectedCase: pendingDocCase,
      docGateAcceptedCaseId: '',
      repairAccessPrompt: null,
      activeTab: 'tramite',
    })).toBe(true);

    expect(shouldOpenDocumentationGate({
      activeView: 'gestion',
      selectedCase: pendingDocCase,
      docGateAcceptedCaseId: '',
      repairAccessPrompt: null,
      activeTab: 'gestion',
    })).toBe(false);
  });

  it('excluye abogado del doc-gate y mantiene bloqueo para no abogado', () => {
    const pendingDocLawyerCase = {
      id: '451',
      tramiteType: 'Reclamo de Tercero - Abogado',
      thirdParty: {
        claim: {
          documentationStatus: 'Incompleta',
        },
      },
    };
    const pendingDocNonLawyerCase = {
      id: '901',
      tramiteType: 'Reclamo de Tercero - Taller',
      thirdParty: {
        claim: {
          documentationStatus: 'Incompleta',
        },
      },
    };

    expect(shouldOpenDocumentationGate({
      activeView: 'gestion',
      selectedCase: pendingDocLawyerCase,
      docGateAcceptedCaseId: '',
      repairAccessPrompt: null,
      activeTab: 'tramite',
    })).toBe(false);

    expect(shouldOpenDocumentationGate({
      activeView: 'gestion',
      selectedCase: pendingDocNonLawyerCase,
      docGateAcceptedCaseId: '',
      repairAccessPrompt: null,
      activeTab: 'tramite',
    })).toBe(true);
  });

  it('no crashea en acceso desde panel abogado si thirdParties viene undefined', () => {
    const backendLikeLawyerCase = {
      id: '451',
      code: '0451RAZ',
      counter: 451,
      tramiteType: 'Reclamo de Tercero - Abogado',
      caseTypeCode: 'RECLAMO_TERCEROS_ABOGADO',
      folderCreated: true,
      createdAt: '2026-05-01',
      vehicle: {
        brand: 'Ford',
        model: 'Focus',
        plate: 'ABC123',
        type: 'Auto',
        usage: 'Particular',
        paint: 'Liso',
        year: '2020',
        color: 'Gris',
        chassis: 'VIN123',
        engine: 'ENG123',
        transmission: 'Manual',
        mileage: '10000',
      },
      customer: {
        firstName: 'Test',
        lastName: 'User',
      },
      budget: {
        ...createBudgetDefaults(),
        lines: [],
        services: [],
      },
      repair: {
        parts: [],
        quoteRows: [],
        turno: { date: '', estimatedDays: '', state: 'Pendiente', notes: '' },
        ingreso: { items: [], observation: '' },
        egreso: { date: '', shouldReenter: 'NO', definitiveExit: false, reentryDate: '', reentryEstimatedDays: '' },
      },
      payments: {
        comprobante: 'A',
        hasSena: 'NO',
        senaAmount: '',
        settlements: [],
        invoices: [],
        depositedAmount: '',
        paymentDate: '',
      },
      todoRisk: createTodoRiskDefaults(),
      thirdParty: createThirdPartyDefaults({
        claim: {
          thirdParties: undefined,
        },
      }),
      lawyer: createLawyerDefaults(),
    };

    expect(() => shouldPromptRepairAccess(backendLikeLawyerCase, { tab: 'gestion' })).not.toThrow();
  });

  it('fuerza reset de sesion ante 401/403 para evitar estado mixto al abrir carpeta', () => {
    expect(shouldForceAuthReset({ httpStatus: 401 })).toBe(true);
    expect(shouldForceAuthReset({ httpStatus: 403 })).toBe(true);
    expect(shouldForceAuthReset({ httpStatus: 500 })).toBe(false);
    expect(shouldForceAuthReset(new Error('network'))).toBe(false);
  });

  it('devuelve null cuando selectedCaseId existe pero el caso aun no esta hidratado localmente', () => {
    const cases = [{ id: 1 }, { id: 2 }];

    expect(resolveSelectedCaseById(cases, '9412')).toBeNull();
  });

  it('usa primer caso cuando no hay selectedCaseId', () => {
    const first = { id: 1 };
    const cases = [first, { id: 2 }];

    expect(resolveSelectedCaseById(cases, '')).toBe(first);
  });
});
