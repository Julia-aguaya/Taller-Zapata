/**
 * Smoke tests de integración para componentes del bundle de gestión.
 * No usa MSW — los componentes reciben props directamente.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import GestionView from '../../../features/gestion/components/GestionView';
import FichaTecnicaTab from '../../../features/gestion/components/FichaTecnicaTab';
import GestionTramiteTab from '../../../features/gestion/components/GestionTramiteTab';
import PresupuestoTab from '../../../features/gestion/components/PresupuestoTab';
import PagosTab from '../../../features/gestion/components/PagosTab';
import DocumentacionTab from '../../../features/gestion/components/DocumentacionTab';

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
    // Debe mostrar los tabs: Ficha Tecnica, Presupuesto, Gestion, Pagos
    expect(screen.getByText(/Ficha Tecnica/)).toBeInTheDocument();
    expect(screen.getByText(/Presupuesto/)).toBeInTheDocument();
    expect(screen.getByText(/Gestión de reparación/)).toBeInTheDocument();
    expect(screen.getByText(/^Pagos/)).toBeInTheDocument();
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

    // Sección vehículo (el DOM tiene "Vehiculo" sin tilde)
    expect(screen.getByText('Vehiculo')).toBeInTheDocument();
    expect(screen.getByDisplayValue('ABC123')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Toyota')).toBeInTheDocument();
  });

  it('renderiza resumen de reparación y pagos', () => {
    render(<FichaTecnicaTab {...baseProps} />);

    // DOM sin tildes: "Resumen Reparacion", "Resumen Pagos"
    expect(screen.getByText('Resumen Reparacion')).toBeInTheDocument();
    expect(screen.getByText('Resumen Pagos')).toBeInTheDocument();
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
});

// ---------------------------------------------------------------------------
// PRESUPUESTOTAB
// ---------------------------------------------------------------------------

describe('PresupuestoTab', () => {
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
    expect(screen.getByText('Taller Zapata')).toBeInTheDocument();
    // Debe mostrar sección de fotos
    expect(screen.getByText('Fotos y videos')).toBeInTheDocument();
  });

  it('renderiza la sección de tareas a realizar', () => {
    render(<PresupuestoTab {...baseProps} />);

    expect(screen.getByText('Tareas a realizar')).toBeInTheDocument();
    // Debe mostrar el botón "Agregar linea"
    expect(screen.getByText('Agregar linea')).toBeInTheDocument();
  });

  it('renderiza la sección de servicios adicionales', () => {
    render(<PresupuestoTab {...baseProps} />);

    expect(screen.getByText('Servicios adicionales')).toBeInTheDocument();
    expect(screen.getByText('Estiraje en bancada')).toBeInTheDocument();
  });

  it('renderiza totales y botón de generar presupuesto', () => {
    render(<PresupuestoTab {...baseProps} />);

    expect(screen.getByText('Totales y condiciones para emitir')).toBeInTheDocument();
    expect(screen.getByText('Generar presupuesto')).toBeInTheDocument();
    expect(screen.getByText('Total presupuesto')).toBeInTheDocument();
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

  beforeEach(() => {
    // Mock window.open para el botón de recibo demo
    vi.spyOn(window, 'open').mockImplementation(() => null);
  });

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

    expect(screen.getByText('Recibo / PDF')).toBeInTheDocument();
    expect(screen.getByText('+ Agregar pago')).toBeInTheDocument();
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
    expect(screen.getByText('Descargar todo')).toBeInTheDocument();
  });
});
