/**
 * Smoke tests de integración para componentes del bundle de gestión.
 * Los componentes reciben props directas y, cuando hace falta,
 * se mockean lecturas puntuales al backend con MSW.
 */
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import userEvent from '@testing-library/user-event';
import { shouldPromptRepairAccess } from '../../../App';

import GestionView from '../../../features/gestion/components/GestionView';
import FichaTecnicaTab from '../../../features/gestion/components/FichaTecnicaTab';
import GestionTramiteTab from '../../../features/gestion/components/GestionTramiteTab';
import PresupuestoTab from '../../../features/gestion/components/PresupuestoTab';
import PagosTab from '../../../features/gestion/components/PagosTab';
import DocumentacionTab from '../../../features/gestion/components/DocumentacionTab';
import GestionReparacionTab from '../../../features/gestion/components/GestionReparacionTab';
import { WORKSHOP_STORAGE_KEY } from '../../../features/gestion/lib/workshopCatalog';
import { storeBackendSession } from '../../../lib/api/backend';
import { server } from '../../setupTests';

// ---------------------------------------------------------------------------
// MOCK DATA
// ---------------------------------------------------------------------------

/**
 * mockCase para el flujo Particular (default).
 * Cubre: GestionView, FichaTecnicaTab, PresupuestoTab, PagosTab.
 */
const mockCase = {
  id: 'test-1',
  code: '0001PZ',
  claimNumber: '833612',
  branch: 'Zapata',
  createdAt: '2026-03-12',
  folderCreated: true,
  tramiteType: 'Particular',

  vehicle: {
    brand: 'Toyota',
    model: 'Corolla',
    plate: 'ABC123',
    year: '2022',
    type: 'Auto',
    usage: 'Particular',
    paint: 'Liso',
    color: 'Blanco',
    chassis: 'VINTOYOTA123',
    engine: '1ZZFE987654',
    transmission: 'Manual',
    mileage: '50000',
    observations: '',
  },

  customer: {
    firstName: 'Juan',
    lastName: 'Perez',
    document: '20123456',
    phone: '3413505050',
    email: 'juan@test.com',
    birthDate: '1990-05-21',
    locality: 'Rosario',
    street: 'Bv. Oroño',
    streetNumber: '1054',
    addressExtra: '',
    occupation: 'Empleado',
    civilStatus: 'Soltero/a',
    referenced: 'NO',
    referencedName: '',
  },

  budget: {
    workshop: 'Taller Zapata',
    reportStatus: 'Informe abierto',
    authorizer: 'PABLO ZAPATA',
    laborWithoutVat: '0',
    generated: false,
    lines: [
      {
        id: 'line-1',
        piece: 'Paragolpe delantero',
        task: 'REEMPLAZAR Y PINTAR',
        damageLevel: 'Daño fuerte (+ 25%)',
        partPrice: '650000',
        replacementDecision: 'Debe reemplazarse',
        action: 'Reemplazar',
      },
    ],
    services: [
      { id: 'svc-1', label: 'Estiraje en bancada', status: 'NO', detail: '' },
      { id: 'svc-2', label: 'Alineación', status: 'NO', detail: '' },
      { id: 'svc-3', label: 'Balanceo', status: 'NO', detail: '' },
      { id: 'svc-4', label: 'Recambio cristales', status: 'NO', detail: '' },
      { id: 'svc-5', label: 'Trabajos sobre sist. eléctrico', status: 'NO', detail: '' },
      { id: 'svc-6', label: 'Trabajos de mecánicas', status: 'NO', detail: '' },
    ],
    partsQuotedDate: '',
    partsProvider: '',
    observations: '',
    estimatedWorkDays: '',
    minimumLaborClose: '',
    accessoryWorkEnabled: 'NO',
    accessoryWorks: [
      { id: 'aw-1', detail: '', amount: '', includesReplacement: 'NO', replacementPiece: '', replacementAmount: '' },
    ],
    accessoryNotes: '',
  },

  repair: {
    parts: [],
    quoteRows: [],
    turno: {
      date: '',
      estimatedDays: '',
      state: 'Pendiente programar',
      notes: '',
    },
    ingreso: {
      realDate: '',
      hasObservation: 'NO',
      observation: '',
      items: [],
    },
    egreso: {
      date: '',
      notes: '',
      shouldReenter: 'NO',
      reentryDate: '',
      reentryEstimatedDays: '',
      reentryState: 'Pendiente',
      reentryNotes: '',
      definitiveExit: false,
      repairedPhotos: false,
      repairedMedia: [],
    },
  },

  payments: {
    comprobante: 'A',
    hasSena: 'SI',
    senaAmount: '120000',
    senaDate: '2026-03-13',
    senaMode: 'Transferencia',
    senaModeDetail: '',
    settlements: [
      {
        id: 'settle-1',
        kind: 'Parcial',
        amount: '150000',
        date: '2026-03-19',
        mode: 'Transferencia',
        modeDetail: '',
        reason: '',
        gainsRetention: '0',
        ivaRetention: '0',
        dreiRetention: '0',
        employerContributionRetention: '0',
        iibbRetention: '0',
      },
    ],
    invoice: 'SI',
    businessName: 'Talleres Zapata SRL',
    invoiceNumber: '0002-0002541',
    invoices: [],
    signedAgreementDate: '',
    passedToPaymentsDate: '',
    estimatedPaymentDate: '',
    paymentDate: '',
    depositedAmount: '0',
    manualTotalAmount: '',
    hasRetentions: 'NO',
    retentions: {
      iva: '',
      gains: '',
      employerContribution: '',
      iibb: '',
      drei: '',
      other: '',
    },
  },

  todoRisk: {
    insurance: {
      company: '',
      policyNumber: '',
      certificateNumber: '',
      thirdCompany: '',
      cleasNumber: '',
      handlerName: '',
      handlerEmail: '',
      handlerPhone: '',
      inspectorName: '',
      inspectorEmail: '',
      inspectorPhone: '',
      coverageDetail: '',
    },
    incident: {
      date: '',
      location: '',
      time: '',
      dynamics: '',
      thirdPartyPlate: '',
      observations: '',
    },
    franchise: {
      status: 'Pendiente',
      amount: '',
      recoveryType: '',
      associatedCase: '',
      dictamen: '',
      exceedsFranchise: 'SI',
      recoveryAmount: '',
      notes: '',
    },
    documentation: {
      items: [],
    },
    processing: {
      presentedDate: '',
      derivedToInspectionDate: '',
      modality: 'Presencial',
      quoteStatus: 'Pendiente',
      quoteDate: '',
      agreedAmount: '',
      cleasScope: '',
      dictamen: 'Pendiente',
      franchiseAmount: '',
      clientChargeAmount: '',
      clientChargeStatus: 'Pendiente',
      clientChargeDate: '',
      companyFranchisePaymentAmount: '',
      companyFranchisePaymentStatus: 'Pendiente',
      companyFranchisePaymentDate: '',
      agenda: [],
      adminTurnOverride: false,
      noRepairNeeded: false,
    },
  },

  thirdParty: {
    clientRegistry: {
      isOwner: 'SI',
      ownershipPercentage: '100%',
      owners: [],
    },
    claim: {
      presentedDate: '',
      claimReference: '',
      thirdCompany: '',
      thirdParties: [],
      documentationStatus: 'Incompleta',
      documentationAccepted: false,
      documents: [],
      partsProviderMode: 'Provee Cía.',
    },
    payments: {
      clientPayments: [],
    },
  },

  franchiseRecovery: null,
  lawyer: null,

  vehicleMedia: [],

  computed: {
    budgetParts: [],
    partsTotal: 0,
    repairPartsTotal: 0,
    laborWithoutVat: 0,
    laborVat: 0,
    laborWithVat: 0,
    budgetTotalWithVat: 0,
    totalQuoted: 0,
    paidAmount: 0,
    balance: 150000,
    totalRetentions: 0,
    paymentState: 'Pendiente',
    canGenerateBudget: false,
    budgetReady: false,
    hasReplacementParts: false,
    allPartsReceived: false,
    partsStatus: 'Sin repuestos',
    budgetServices: [],
    ingresoItems: [],
    turnoEstimatedExit: '',
    turnoReady: false,
    reentryEstimatedExit: '',
    estimatedReferenceDate: '',
    repairResolved: false,
    closeReady: false,
    closeDate: '',
    tramiteStatus: 'Ingresado',
    repairStatus: 'En trámite',
    blockers: [],
    pendingTasksCount: 0,
    urgency: 0,
    reportClosed: false,
    hasVehicleData: false,
    vehicleMissingFields: [],
    pendingReplacementDecision: null,
    tabs: {
      ficha: 'advanced',
      presupuesto: 'pending',
      gestion: 'pending',
      pagos: 'pending',
    },
    todoRisk: {
      quoteAgreed: false,
      paymentsReady: false,
      canCompleteProcessingCore: false,
      amountToInvoice: 0,
    },
    thirdParty: {
      companyPaymentReady: false,
      hasExtraWorks: false,
      clientExtrasReady: false,
      clientExtrasBalance: 0,
    },
    cleasScope: null,
  },

  backendWorkflow: {
    actions: [],
    history: [],
  },

  meta: {
    lastSavedByTab: {},
    syncErrorsByTab: {},
    dirtyTabs: {},
  },
};

const todoRiskCase = {
  ...structuredClone(mockCase),
  id: 'test-tr-1',
  code: '0009TZ',
  tramiteType: 'Todo Riesgo',
  todoRisk: {
    ...structuredClone(mockCase.todoRisk),
    insurance: {
      ...structuredClone(mockCase.todoRisk.insurance),
      company: 'Sancor Seguros',
    },
    processing: {
      ...structuredClone(mockCase.todoRisk.processing),
      presentedDate: '2026-03-15',
      modality: 'Presencial',
      quoteStatus: 'Acordada',
      quoteDate: '2026-03-18',
      agreedAmount: '450000',
    },
  },
  repair: {
    ...structuredClone(mockCase.repair),
    turno: {
      ...structuredClone(mockCase.repair.turno),
      estimatedDays: '3',
      state: 'Confirmado',
    },
    parts: [
      {
        id: 'part-tr-1',
        name: 'Óptica delantera',
        provider: 'Proveedor Norte',
        amount: '120000',
        budgetAmount: '120000',
        state: 'Pendiente',
        authorized: 'SI',
        source: 'budget',
        sourceLineId: 'line-1',
        purchaseBy: 'Taller',
        paymentStatus: 'Pendiente',
      },
    ],
  },
  computed: {
    ...structuredClone(mockCase.computed),
    budgetReady: true,
    hasReplacementParts: true,
    turnoReady: true,
    reportClosed: true,
    repairStatus: 'Con Turno',
    tabs: {
      ...structuredClone(mockCase.computed.tabs),
      tramite: 'advanced',
      gestion: 'advanced',
    },
    todoRisk: {
      ...structuredClone(mockCase.computed.todoRisk),
      canProgressFromPresentation: true,
      canCompleteProcessingCore: true,
      quoteAgreed: true,
      managementAdvanced: true,
      daysProcessing: 5,
      amountToInvoice: 450000,
    },
  },
};

// ---------------------------------------------------------------------------
// GESTIONVIEW (orquestador principal)
// ---------------------------------------------------------------------------

describe('GestionView', () => {
  const baseProps = {
    item: mockCase,
    activeTab: 'ficha',
    activeRepairTab: 'turno',
    onChangeTab: vi.fn(),
    onChangeRepairTab: vi.fn(),
    updateCase: vi.fn(),
    flash: vi.fn(),
    onSyncCase: vi.fn(),
    onRunWorkflowTransition: vi.fn(),
    isSavingCase: false,
    hasUnsavedChanges: false,
    insuranceCatalogs: null,
    financeCatalogs: null,
    debugCodeIssues: [],
    allCases: [],
  };

  it('renderiza estado vacío cuando item=null', () => {
    render(<GestionView {...baseProps} item={null} />);
    expect(screen.getByText('No hay carpeta seleccionada.')).toBeInTheDocument();
  });

  it('renderiza con item mock: muestra nombre de carpeta y tabs', () => {
    render(<GestionView {...baseProps} />);
    // El heading incluye el código de caso
    expect(screen.getByText(/0001PZ/)).toBeInTheDocument();
    // Debe mostrar los tabs: Ficha Técnica, Presupuesto, Gestión, Pagos
    expect(screen.getByRole('button', { name: /Ficha Técnica/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Presupuesto/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Gestión de reparación/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Pagos/ })).toBeInTheDocument();
  });

  it('renderiza el tab activo (ficha por defecto)', () => {
    render(<GestionView {...baseProps} />);
    // FichaTecnicaTab muestra "Cliente" como heading
    expect(screen.getByText('Cliente')).toBeInTheDocument();
  });

  it('muestra el guardado junto a la seccion activa con estado visible', () => {
    render(<GestionView {...baseProps} activeTab="gestion" hasUnsavedChanges />);

    expect(screen.getByText('Edición activa')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeInTheDocument();
    expect(screen.getAllByText('Gestión de reparación').length).toBeGreaterThan(0);
    expect(screen.getByText('Cambios sin guardar')).toBeInTheDocument();
    expect(screen.getByText(/tenés cambios pendientes/i)).toBeInTheDocument();
  });

  it('cambia de tab al hacer click en Presupuesto', async () => {
    const onChangeTab = vi.fn();
    const user = userEvent.setup();

    render(<GestionView {...baseProps} onChangeTab={onChangeTab} />);

    const presupuestoBtn = screen.getByText(/Presupuesto/);
    await user.click(presupuestoBtn);

    expect(onChangeTab).toHaveBeenCalledWith('presupuesto');
  });

  it('permite abrir Gestión de reparación aunque presupuesto siga en rojo', async () => {
    const onChangeTab = vi.fn();
    const flash = vi.fn();
    const user = userEvent.setup();

    render(<GestionView {...baseProps} flash={flash} onChangeTab={onChangeTab} />);

    await user.click(screen.getByRole('button', { name: /Gestión de reparación/i }));

    expect(onChangeTab).toHaveBeenCalledWith('gestion');
    expect(flash).not.toHaveBeenCalled();
  });

  it('guarda solo presupuesto desde Guardar cotizacion', async () => {
    const user = userEvent.setup();
    const onSyncCase = vi.fn().mockResolvedValue(true);

    render(<GestionView {...baseProps} activeTab="presupuesto" hasUnsavedChanges onSyncCase={onSyncCase} />);

    await user.click(screen.getByRole('button', { name: 'Guardar cotizacion' }));

    expect(onSyncCase).toHaveBeenCalledWith({ tabs: ['presupuesto'], changeNote: '' });
  });

  it('en abogado, el click en Gestión de reparación sigue despachando tab gestion', async () => {
    const onChangeTab = vi.fn();
    const user = userEvent.setup();
    const lawyerCase = {
      ...structuredClone(mockCase),
      id: 'lawyer-1',
      tramiteType: 'Reclamo de Tercero - Abogado',
      computed: {
        ...structuredClone(mockCase.computed),
        todoRisk: {
          ...structuredClone(mockCase.computed.todoRisk),
          turnWarningRequired: true,
        },
      },
    };

    render(<GestionView {...baseProps} item={lawyerCase} onChangeTab={onChangeTab} activeTab="abogado" />);

    await user.click(screen.getByRole('button', { name: /Gestión de reparación/i }));

    expect(onChangeTab).toHaveBeenCalledWith('gestion');
  });

  it('mantiene la advertencia al evaluar una carpeta backend recien hidratada', () => {
    const backendLikeCase = structuredClone(todoRiskCase);
    backendLikeCase.todoRisk.processing.quoteStatus = 'Pendiente';
    backendLikeCase.todoRisk.processing.quoteDate = '';
    backendLikeCase.todoRisk.processing.agreedAmount = '';
    delete backendLikeCase.computed;

    expect(shouldPromptRepairAccess(backendLikeCase, { tab: 'gestion' })).toBe(true);
  });

  it('muestra historial cuando el detalle viene con id numerico y la carpeta local usa id string', () => {
    render(
      <GestionView
        {...baseProps}
        detailState={{
          item: { id: 1 },
          auditEventsState: {
            status: 'success',
            items: [
              {
                id: 'evt-1',
                domain: 'casefile',
                actionCode: 'actualizar_siniestro_caso',
                changeNote: 'Actualizamos la fecha del siniestro',
                actorDisplayName: 'Usuario Test',
                createdAt: '2026-05-10T12:00:00Z',
              },
            ],
            total: 1,
            detail: 'Actividad reciente',
          },
        }}
        item={{ ...mockCase, id: '1' }}
      />,
    );

    expect(screen.getByText('Actualizar Siniestro Caso')).toBeInTheDocument();
    expect(screen.getByText('Nota: Actualizamos la fecha del siniestro')).toBeInTheDocument();
    expect(screen.getByText('Usuario Test')).toBeInTheDocument();
  });

  it('muestra warning operativo en GestionView cuando falta cotizacion acordada', async () => {
    const user = userEvent.setup();
    const flash = vi.fn();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const item = {
      ...structuredClone(todoRiskCase),
      todoRisk: {
        ...structuredClone(todoRiskCase.todoRisk),
        processing: {
          ...structuredClone(todoRiskCase.todoRisk.processing),
          quoteStatus: 'Pendiente',
          quoteDate: '',
          agreedAmount: '',
        },
      },
      computed: {
        ...structuredClone(todoRiskCase.computed),
        todoRisk: {
          ...structuredClone(todoRiskCase.computed.todoRisk),
          quoteAgreed: false,
          turnWarningRequired: true,
        },
      },
    };

    render(<GestionView {...baseProps} item={item} activeTab="gestion" activeRepairTab="turno" flash={flash} />);

    expect(screen.getByText(/Podés seguir con agenda y turno/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Agendar turno' }));

    expect(flash).toHaveBeenCalledWith(expect.stringContaining('Turno agendado con advertencia.'));
    confirmSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// FICHATECNICATAB
// ---------------------------------------------------------------------------

describe('FichaTecnicaTab', () => {
  const baseProps = {
    item: mockCase,
    updateCase: vi.fn(),
  };

  it('renderiza campos de cliente y vehículo', () => {
    render(<FichaTecnicaTab {...baseProps} />);

    // Sección cliente
    expect(screen.getByText('Cliente')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Juan')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Perez')).toBeInTheDocument();

    expect(screen.getByText('Vehículo')).toBeInTheDocument();
    expect(screen.getByDisplayValue('ABC123')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Toyota')).toBeInTheDocument();
  });

  it('renderiza resumen de reparación y pagos', () => {
    render(<FichaTecnicaTab {...baseProps} />);

    expect(screen.getByText('Resumen Reparación')).toBeInTheDocument();
    expect(screen.getByText('Resumen de pagos')).toBeInTheDocument();
    expect(screen.getByText('Lectura consolidada')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// GESTIONTRAMITETAB
// ---------------------------------------------------------------------------

describe('GestionTramiteTab', () => {
  const baseProps = {
    item: mockCase,
    updateCase: vi.fn(),
    flash: vi.fn(),
    insuranceCatalogs: null,
    allCases: [],
  };

  it('renderiza la sección de gestión del trámite (secuencia default)', () => {
    render(<GestionTramiteTab {...baseProps} />);

    // Debe mostrar "Gestión del trámite" como eyebrow
    expect(screen.getByText('Gestión del trámite')).toBeInTheDocument();
    // Debe mostrar "Datos del seguro"
    expect(screen.getByText('Datos del seguro')).toBeInTheDocument();
    // Debe mostrar "Datos del siniestro"
    expect(screen.getByText('Datos del siniestro')).toBeInTheDocument();
    // Debe mostrar la tabla de documentación
    expect(screen.getByText('Documentación')).toBeInTheDocument();
  });

  it('muestra alerta de fecha de siniestro faltante', () => {
    render(<GestionTramiteTab {...baseProps} />);
    expect(
      screen.getByText(/Sin fecha del siniestro no se habilita/),
    ).toBeInTheDocument();
  });

  it('muestra franquicia cuando no es CLEAS', () => {
    render(<GestionTramiteTab {...baseProps} />);
    expect(screen.getByText('Franquicia')).toBeInTheDocument();
  });

  it('muestra opciones pedidas en Recupero y Franquicia para Todo Riesgo', () => {
    render(<GestionTramiteTab {...baseProps} item={todoRiskCase} />);

    expect(screen.getByRole('option', { name: 'Cia Del 3ero' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Abona Cliente' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '3ero particular' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Propia Cia' })).toBeInTheDocument();

    expect(screen.getByRole('option', { name: 'Sin Franquicia' })).toBeInTheDocument();
    expect(screen.getAllByRole('option', { name: 'Pendiente' }).length).toBeGreaterThan(0);
    expect(screen.getByRole('option', { name: 'Cobrada' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Bonificada' })).toBeInTheDocument();
  });

  it('fuerza 4 opciones de Franquicia y Recupero cuando catálogo backend no matchea', () => {
    const nonMatchingCatalogs = {
      franchiseStatusCodes: [
        { code: 'SFR', name: 'Estado X' },
        { code: 'PENX', name: 'Estado Y' },
      ],
      franchiseRecoveryTypeCodes: [
        { code: 'R1', name: 'Recupero A' },
        { code: 'R2', name: 'Recupero B' },
      ],
    };

    render(<GestionTramiteTab {...baseProps} item={todoRiskCase} insuranceCatalogs={nonMatchingCatalogs} />);

    expect(screen.getByRole('option', { name: 'Sin Franquicia' })).toBeInTheDocument();
    expect(screen.getAllByRole('option', { name: 'Pendiente' }).length).toBeGreaterThan(0);
    expect(screen.getByRole('option', { name: 'Cobrada' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Bonificada' })).toBeInTheDocument();

    expect(screen.getByRole('option', { name: 'Cia Del 3ero' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Abona Cliente' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '3ero particular' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Propia Cia' })).toBeInTheDocument();
  });

  it('oculta bloque de Franquicia en CLEAS (incluye Propia Cia)', () => {
    const cleasCase = {
      ...structuredClone(todoRiskCase),
      tramiteType: 'CLEAS / Terceros / Franquicia',
    };

    render(<GestionTramiteTab {...baseProps} item={cleasCase} />);

    expect(screen.queryByText('Franquicia')).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Propia Cia' })).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// PRESUPUESTOTAB
// ---------------------------------------------------------------------------

describe('PresupuestoTab', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  const baseProps = {
    item: mockCase,
    updateCase: vi.fn(),
    flash: vi.fn(),
  };

  it('renderiza la cabecera del presupuesto con taller y vehículo', () => {
    render(<PresupuestoTab {...baseProps} />);

    // El eyebrow dice "Presupuesto Particular"
    expect(screen.getByText('Presupuesto Particular')).toBeInTheDocument();
    // Debe mostrar el nombre del taller
    expect(screen.getByRole('heading', { name: 'Taller Zapata' })).toBeInTheDocument();
    // Debe mostrar sección de fotos
    expect(screen.getByText('Fotos y videos')).toBeInTheDocument();
  });

  it('renderiza la sección de tareas a realizar', () => {
    render(<PresupuestoTab {...baseProps} />);

    expect(screen.getByText('Tareas a realizar')).toBeInTheDocument();
    // Debe mostrar el botón "Agregar línea"
    expect(screen.getByText('Agregar línea')).toBeInTheDocument();
  });

  it('renderiza la sección de servicios adicionales', () => {
    render(<PresupuestoTab {...baseProps} />);

    expect(screen.getByText('Servicios adicionales')).toBeInTheDocument();
    expect(screen.getByText('Estiraje en bancada')).toBeInTheDocument();
  });

  it('renderiza totales y botón de generar presupuesto', () => {
    render(<PresupuestoTab {...baseProps} />);

    expect(screen.getByText('Precios, mano de obra y repuestos estimados')).toBeInTheDocument();
    expect(screen.getAllByText('Proveedor sugerido').length).toBeGreaterThan(0);
    expect(screen.getByText('Guardar cotizacion')).toBeInTheDocument();
    expect(screen.getByText('Generar presupuesto')).toBeInTheDocument();
    expect(screen.getByText('Previsualizar PDF')).toBeDisabled();
    expect(screen.getByText('Descargar PDF')).toBeDisabled();
    expect(screen.getByText('Total presupuesto')).toBeInTheDocument();
  });

  it('permite guardar cotizacion sin generar el presupuesto final', async () => {
    const user = userEvent.setup();
    const onSaveQuote = vi.fn().mockResolvedValue(true);

    render(<PresupuestoTab {...baseProps} onSaveQuote={onSaveQuote} />);

    await user.click(screen.getByText('Guardar cotizacion'));

    expect(onSaveQuote).toHaveBeenCalledTimes(1);
    expect(onSaveQuote).not.toHaveBeenCalledWith(expect.objectContaining({ generated: true }));
  });

  it('deshabilita Guardar cotizacion cuando el presupuesto esta cerrado', () => {
    render(
      <PresupuestoTab
        {...baseProps}
        item={{
          ...mockCase,
          budget: {
            ...mockCase.budget,
            reportStatus: 'Informe cerrado',
          },
          computed: {
            ...mockCase.computed,
            reportClosed: true,
          },
        }}
      />,
    );

    expect(screen.getByRole('button', { name: 'Guardar cotizacion' })).toBeDisabled();
    expect(screen.getByText('Presupuesto cerrado: la cotizacion ya no es editable.')).toBeInTheDocument();
  });

  it('evita ejecutar onSaveQuote cuando el presupuesto esta cerrado', async () => {
    const user = userEvent.setup();
    const onSaveQuote = vi.fn().mockResolvedValue(true);

    render(
      <PresupuestoTab
        {...baseProps}
        onSaveQuote={onSaveQuote}
        item={{
          ...mockCase,
          budget: {
            ...mockCase.budget,
            reportStatus: 'Informe cerrado',
          },
          computed: {
            ...mockCase.computed,
            reportClosed: true,
          },
        }}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Guardar cotizacion' }));

    expect(onSaveQuote).not.toHaveBeenCalled();
  });

  it('expone preview y descarga del PDF cuando el presupuesto ya fue generado', async () => {
    const user = userEvent.setup();
    const onPreviewBudgetPdf = vi.fn().mockResolvedValue({
      blobUrl: 'blob:demo',
      fileName: 'presupuesto-demo.pdf',
      mimeType: 'application/pdf',
    });
    const onDownloadBudgetPdf = vi.fn().mockResolvedValue(true);

    render(
      <PresupuestoTab
        {...baseProps}
        item={{
          ...mockCase,
          id: '25',
          budget: {
            ...mockCase.budget,
            generated: true,
          },
        }}
        onDownloadBudgetPdf={onDownloadBudgetPdf}
        onPreviewBudgetPdf={onPreviewBudgetPdf}
      />,
    );

    await user.click(screen.getByText('Previsualizar PDF'));
    await user.click(screen.getByText('Descargar PDF'));

    expect(onPreviewBudgetPdf).toHaveBeenCalledWith('25');
    expect(onDownloadBudgetPdf).toHaveBeenCalledWith('25');
    expect(screen.getByRole('dialog', { name: 'Vista previa de presupuesto-demo.pdf' })).toBeInTheDocument();
    expect(screen.getByTitle('presupuesto-demo.pdf')).toBeInTheDocument();
  });

  it('muestra feedback claro cuando no hay PDF para previsualizar presupuesto cerrado', async () => {
    const user = userEvent.setup();
    const flash = vi.fn();
    const onPreviewBudgetPdf = vi.fn().mockResolvedValue(null);

    render(
      <PresupuestoTab
        {...baseProps}
        flash={flash}
        item={{
          ...mockCase,
          id: '26',
          budget: {
            ...mockCase.budget,
            generated: true,
          },
        }}
        onPreviewBudgetPdf={onPreviewBudgetPdf}
      />,
    );

    await user.click(screen.getByText('Previsualizar PDF'));

    expect(onPreviewBudgetPdf).toHaveBeenCalledWith('26');
    expect(flash).toHaveBeenCalledWith('El backend no devolvió un PDF para previsualizar este presupuesto cerrado.');
  });

  it('usa el catálogo editable de talleres para la cabecera del presupuesto', () => {
    window.localStorage.setItem(WORKSHOP_STORAGE_KEY, JSON.stringify([
      {
        id: 'zapata',
        label: 'Taller Zapata',
        legalName: 'Catálogo Admin SRL',
        taxId: '30-00000000-1',
        taxCondition: 'Responsable Inscripto',
        address: 'Rosario 123',
        phone: '3410000000',
        email: 'admin@test.com',
        logo: '',
      },
    ]));

    render(<PresupuestoTab {...baseProps} />);

    expect(screen.getByText('Catálogo Admin SRL')).toBeInTheDocument();
    expect(screen.getByText('30-00000000-1 · Responsable Inscripto')).toBeInTheDocument();
  });

  it('hidrata el catálogo de talleres desde backend cuando existe sesión autenticada', async () => {
    storeBackendSession({
      accessToken: 'mock-access-token-12345',
      refreshToken: 'mock-refresh-token-67890',
      expiresInSeconds: 3600,
      user: { role: 'admin' },
    });

    server.use(
      http.get('*/api/v1/system/parameters/WORKSHOP_CATALOG', () => HttpResponse.json({
        code: 'WORKSHOP_CATALOG',
        value: JSON.stringify([
          {
            id: 'zapata',
            label: 'Taller Zapata',
            legalName: 'Catálogo Global Backend SRL',
            taxId: '30-99999999-9',
            taxCondition: 'Responsable Inscripto',
            address: 'Backend 456',
            phone: '3419999999',
            email: 'backend@test.com',
            logo: '',
          },
        ]),
        dataTypeCode: 'JSON',
        description: 'Catalogo compartido de talleres para presupuesto',
        editable: true,
        visible: false,
        moduleCode: 'GESTION',
      })),
    );

    render(<PresupuestoTab {...baseProps} />);

    expect(await screen.findByText('Catálogo Global Backend SRL')).toBeInTheDocument();
    expect(screen.getByText('30-99999999-9 · Responsable Inscripto')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// PAGOSTAB
// ---------------------------------------------------------------------------

describe('PagosTab', () => {
  const baseProps = {
    item: mockCase,
    updateCase: vi.fn(),
    flash: vi.fn(),
    financeCatalogs: null,
    insuranceCatalogs: null,
  };

  it('renderiza cabecera de pagos con tipo de comprobante', () => {
    render(<PagosTab {...baseProps} />);

    // Debe mostrar el eyebrow "Pagos"
    expect(screen.getByText('Pagos')).toBeInTheDocument();
    // Debe mostrar "Comprobante, saldo y lectura contable"
    expect(
      screen.getByText('Comprobante, saldo y lectura contable'),
    ).toBeInTheDocument();
    // Debe mostrar "Cancelaciones"
    expect(screen.getByText('Cancelaciones')).toBeInTheDocument();
  });

  it('renderiza nombre del cliente y vehículo en el recibo', () => {
    render(<PagosTab {...baseProps} />);

    // getFolderDisplayName para Particular: "Perez, Juan"
    expect(screen.getByText('Perez, Juan')).toBeInTheDocument();
    expect(screen.getByText(/Toyota Corolla - ABC123/)).toBeInTheDocument();
  });

  it('renderiza el botón de recibo y agregar pago', () => {
    render(<PagosTab {...baseProps} />);

    expect(screen.getByText('PDF no disponible')).toBeInTheDocument();
    expect(screen.getByText('+ Agregar pago')).toBeInTheDocument();
  });

  it('muestra mensajes honestos para acciones no integradas', () => {
    render(<PagosTab {...baseProps} />);

    expect(screen.getByText('PDF no disponible')).toBeDisabled();
    expect(screen.getByText(/La emisión de PDF real todavía no está integrada/i)).toBeInTheDocument();
  });

  it('muestra los settlements existentes', () => {
    render(<PagosTab {...baseProps} />);

    // "Parcial" aparece como option value, como status badge, y como strong.
    // Verificamos que hay al menos uno mediante getAllByText.
    const matches = screen.getAllByText('Parcial');
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// DOCUMENTACIONTAB
// ---------------------------------------------------------------------------

describe('DocumentacionTab', () => {
  it('renderiza null si el caso no es Reclamo de Tercero - Taller', () => {
    const { container } = render(
      <DocumentacionTab item={mockCase} updateCase={vi.fn()} flash={vi.fn()} />,
    );
    // No debe renderizar nada
    expect(container.innerHTML).toBe('');
  });

  it('renderiza documentación con mock de tercero taller', () => {
    const thirdPartyCase = {
      ...mockCase,
      id: 'test-tp-1',
      code: '0005RZ',
      tramiteType: 'Reclamo de Tercero - Taller',
      thirdParty: {
        clientRegistry: {
          isOwner: 'SI',
          ownershipPercentage: '100%',
          owners: [],
        },
        claim: {
          presentedDate: '2026-03-25',
          claimReference: 'AB2154JB',
          thirdCompany: 'San Cristóbal',
          thirdParties: [],
          documentationStatus: 'Incompleta',
          documentationAccepted: false,
          documents: [
            {
              id: 'doc-tp-1',
              category: 'Personal',
              name: 'Licencia conducir frente',
              uploadedAt: '2026-03-24',
              notes: 'Falta cédula verde',
            },
            {
              id: 'doc-tp-2',
              category: 'Seguro',
              name: 'Denuncia administrativa',
              uploadedAt: '2026-03-25',
              notes: '',
            },
          ],
          partsProviderMode: 'Provee Taller',
        },
        payments: {
          clientPayments: [],
        },
      },
      computed: {
        ...mockCase.computed,
        tabs: {
          ...mockCase.computed.tabs,
          documentacion: 'pending',
        },
        thirdParty: {
          companyPaymentReady: false,
          hasExtraWorks: false,
          clientExtrasReady: false,
          clientExtrasBalance: 0,
        },
      },
    };

    render(
      <DocumentacionTab
        item={thirdPartyCase}
        updateCase={vi.fn()}
        flash={vi.fn()}
      />,
    );

    // Debe mostrar "Documentación" como eyebrow
    expect(screen.getByText('Documentación')).toBeInTheDocument();
    // Debe mostrar "Carpeta base del reclamo"
    expect(screen.getByText('Carpeta base del reclamo')).toBeInTheDocument();
    // Debe mostrar "Documentos cargados"
    expect(screen.getByText('Documentos cargados')).toBeInTheDocument();
    // Los nombres de documentos son valores en inputs, no texto visible
    expect(screen.getByDisplayValue('Licencia conducir frente')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Denuncia administrativa')).toBeInTheDocument();
    // Debe mostrar los botones de acción
    expect(screen.getByText('Agregar ítem')).toBeInTheDocument();
    expect(screen.getByText('Descarga no disponible')).toBeDisabled();
    expect(screen.getByText(/La descarga del legajo todavía no está disponible en esta vista/i)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// GESTIONREPARACIONTAB
// ---------------------------------------------------------------------------

describe('GestionReparacionTab', () => {
  it('permite crear una tarea de seguimiento desde Todo Riesgo sin romper la vista', async () => {
    const user = userEvent.setup();
    const updateCase = vi.fn((updater) => {
      const draft = structuredClone(todoRiskCase);
      updater(draft);
    });

    render(
      <GestionReparacionTab
        activeRepairTab="turno"
        flash={vi.fn()}
        item={todoRiskCase}
        onChangeRepairTab={vi.fn()}
        updateCase={updateCase}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Crear tarea' }));

    expect(updateCase).toHaveBeenCalled();
  });

  it('muestra warning y permite agendar turno sin cotizacion acordada', async () => {
    const user = userEvent.setup();
    const flash = vi.fn();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const item = {
      ...structuredClone(todoRiskCase),
      todoRisk: {
        ...structuredClone(todoRiskCase.todoRisk),
        processing: {
          ...structuredClone(todoRiskCase.todoRisk.processing),
          quoteStatus: 'Pendiente',
          quoteDate: '',
          agreedAmount: '',
        },
      },
      computed: {
        ...structuredClone(todoRiskCase.computed),
        todoRisk: {
          ...structuredClone(todoRiskCase.computed.todoRisk),
          quoteAgreed: false,
          turnWarningRequired: true,
        },
      },
    };

    const { rerender } = render(
      <GestionReparacionTab
        activeRepairTab="repuestos"
        flash={flash}
        item={item}
        onChangeRepairTab={vi.fn()}
        updateCase={vi.fn()}
      />,
    );

    expect(screen.getByText(/Cotización y pedidos/i)).toBeInTheDocument();
    expect(screen.getByText(/La fecha de pedido todavía no tiene campo separado/i)).toBeInTheDocument();

    rerender(
      <GestionReparacionTab
        activeRepairTab="turno"
        flash={flash}
        item={item}
        onChangeRepairTab={vi.fn()}
        updateCase={vi.fn()}
      />,
    );

    expect(screen.getByText(/Podés seguir con agenda y turno/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Agendar turno' }));

    expect(flash).toHaveBeenCalledWith(expect.stringContaining('Turno agendado con advertencia.'));
    confirmSpy.mockRestore();
  });
});
