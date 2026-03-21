import { useEffect, useMemo, useState } from 'react';

const NAV_ITEMS = [
  { id: 'panel', label: 'Panel General' },
  { id: 'nuevo', label: 'Nuevo Caso' },
  { id: 'gestion', label: 'Gestion' },
];

const BRANCHES = [
  { label: 'Zapata', code: 'Z' },
  { label: 'Centro', code: 'C' },
];

const VEHICLE_TYPES = ['Sedan', 'Hatch', 'SUV', 'Pick-up', 'Utilitario'];
const VEHICLE_USES = ['Particular', 'Comercial', 'Aplicacion'];
const PAINT_TYPES = ['Monocapa', 'Bicapa', 'Tricapa', 'Perlado'];
const WORKSHOPS = [
  {
    id: 'zapata',
    label: 'Taller Zapata',
    legalName: 'Talleres Zapata SRL',
    taxId: '30-54986217-5',
    taxCondition: 'Responsable Inscripto',
    address: 'Bv. Oroño 2150 · Rosario',
    phone: '341 426 1200',
    email: 'contacto@tallereszapata.com',
    logo:
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=320&q=80',
  },
  {
    id: 'casablanca',
    label: 'Taller Casablanca',
    legalName: 'Casablanca Car Center SAS',
    taxId: '30-61123344-2',
    taxCondition: 'Responsable Inscripto',
    address: 'Av. Pellegrini 1820 · Rosario',
    phone: '341 420 8800',
    email: 'turnos@casablancacar.com',
    logo:
      'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=320&q=80',
  },
  {
    id: 'repararte',
    label: 'Taller Repararte',
    legalName: 'Repararte Automotores SRL',
    taxId: '30-70321456-9',
    taxCondition: 'Monotributo categoría K',
    address: 'Catamarca 1450 · Rosario',
    phone: '341 525 9000',
    email: 'hola@repararte.com',
    logo:
      'https://images.unsplash.com/photo-1453475250267-163ff185e88b?auto=format&fit=crop&w=320&q=80',
  },
];
const WORKSHOP_OPTIONS = WORKSHOPS.map((workshop) => workshop.label);
const BUDGET_DAMAGE_OPTIONS = ['Daño leve (0 a 8%)', 'Daño medio (8 a 25%)', 'Daño fuerte (+ 25%)', 'Igualacion'];
const BUDGET_TASK_OPTIONS = [
  'REEMPLAZAR',
  'REEMPLAZAR Y PINTAR',
  'REEMPLAZAR Y CARGAR',
  'REPARAR',
  'REPARAR Y PINTAR',
  'REPARAR Y ESCUADRAR',
  'REPARAR, ESCUADRAR Y PINTAR',
  'CARGAR',
  'DIFUMINAR',
  'ESCUADRAR',
  'A VERIFICAR',
];
const BUDGET_PART_DECISION_OPTIONS = ['Debe reemplazarse', 'Puede repararse', 'A verificar'];
const REPORT_STATUS_OPTIONS = ['Informe cerrado', 'Informe abierto'];
const AUTHORIZER_OPTIONS = ['PABLO ZAPATA', 'ENRIQUE ZAPATA', 'MELINA ZAPATA', 'DAMIAN ZAPATA'];
const YES_NO_AV_OPTIONS = ['SI', 'NO', 'A/V'];
const REPAIR_PART_STATE_OPTIONS = ['Pendiente', 'Pedido', 'Recibido', 'Devuelto'];
const REPAIR_PART_BUYER_OPTIONS = ['Taller', 'Cliente'];
const REPAIR_PART_PAYMENT_OPTIONS = ['Pendiente', 'Cancelado'];
const TURNO_STATE_OPTIONS = ['Pendiente programar', 'Probable a confirmar', 'A confirmar cliente', 'Confirmado', 'Reprogramar'];
const INGRESO_TYPES = ['Carrocería', 'Mecánica', 'Accesorios', 'Otro'];
const TRAMITE_STATUS_OPTIONS = ['Ingresado', 'Sin presentar', 'En trámite', 'Presentado (PD)', 'Acordado', 'Pasado a pagos', 'Pagado', 'Rechazado / Desistido'];
const REPAIR_STATUS_OPTIONS = ['Reparado', 'Con Turno', 'Dar Turno', 'Faltan repuestos', 'En trámite', 'No debe repararse', 'Debe reingresar', 'Rechazado / Desistido'];
const PAYMENT_MODES = ['Transferencia', 'Efectivo', 'Debito', 'Credito', 'Otro'];
const COMPROBANTES = ['A', 'C', 'R'];
const TRAMITE_TYPES = ['Particular', 'Todo Riesgo', 'CLEAS / Terceros / Franquicia'];
const PANEL_PAYMENT_FILTERS = ['Todos', 'Por cobrar', 'Ya cobrado'];
const PANEL_TASK_FILTERS = ['Todos', 'Con pendientes', 'Sin pendientes'];
const PANEL_DATE_FILTERS = ['Creación', 'Fecha estimada', 'Fecha de cobro', 'Fecha de cierre'];
const CASE_TABS = ['ficha', 'presupuesto', 'gestion', 'pagos'];
const REPAIR_TABS = ['repuestos', 'turno', 'ingreso', 'egreso'];

function createBudgetService(label, overrides = {}) {
  return {
    id: crypto.randomUUID(),
    label,
    status: 'NO',
    detail: '',
    ...overrides,
  };
}

function createIngresoItem(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    type: 'Otro',
    detail: '',
    media: 'Carpeta demo',
    ...overrides,
  };
}

function createBudgetDefaults(overrides = {}) {
  return {
    workshop: '',
    reportStatus: 'Informe abierto',
    authorizer: AUTHORIZER_OPTIONS[0],
    laborWithoutVat: 0,
    generated: false,
    lines: [createBudgetLine()],
    services: [
      createBudgetService('Estiraje en bancada'),
      createBudgetService('Alineación'),
      createBudgetService('Balanceo'),
      createBudgetService('Recambio cristales'),
      createBudgetService('Trabajos sobre sist. eléctrico'),
      createBudgetService('Trabajos de mecánicas'),
    ],
    partsQuotedDate: '',
    partsProvider: '',
    observations: '',
    estimatedWorkDays: '',
    minimumLaborClose: '',
    ...overrides,
  };
}

function createBudgetLine(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    piece: '',
    task: '',
    damageLevel: '',
    partPrice: '',
    replacementDecision: '',
    action: '',
    ...overrides,
  };
}

function createRepairPart(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    name: '',
    provider: '',
    amount: '',
    state: 'Pendiente',
    purchaseBy: 'Taller',
    paymentStatus: 'Pendiente',
    source: 'manual',
    budgetAmount: '',
    sourceLineId: '',
    ...overrides,
  };
}

function createMediaItem(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    type: 'image',
    label: 'Vista general',
    description: '',
    url: 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1280&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=480&q=60',
    ...overrides,
  };
}

function createSettlement(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    kind: 'Parcial',
    amount: '',
    date: '',
    mode: 'Transferencia',
    modeDetail: '',
    reason: '',
    gainsRetention: '',
    ivaRetention: '',
    dreiRetention: '',
    employerContributionRetention: '',
    iibbRetention: '',
    ...overrides,
  };
}

function createEmptyForm() {
  return {
    type: 'Particular',
    branch: 'Zapata',
    claimNumber: '',
    firstName: '',
    lastName: '',
    phone: '',
    document: '',
    brand: '',
    model: '',
    plate: '',
    vehicleType: 'Sedan',
    vehicleUse: 'Particular',
    paint: 'Bicapa',
    referenced: '',
    referencedName: '',
  };
}

function normalizeDocument(value) {
  return String(value ?? '').replace(/\D/g, '');
}

function normalizePlate(value) {
  return String(value ?? '').replace(/\s+/g, '').toUpperCase();
}

function buildCustomerMockData(items) {
  const registry = new Map();

  items.forEach((item) => {
    const key = normalizeDocument(item.customer.document);
    if (!key || registry.has(key)) return;

    registry.set(key, {
      firstName: item.customer.firstName,
      lastName: item.customer.lastName,
      phone: item.customer.phone,
      document: item.customer.document,
      referenced: item.customer.referenced,
      referencedName: item.customer.referencedName,
    });
  });

  return registry;
}

function buildVehicleMockData(items) {
  const registry = new Map();

  items.forEach((item) => {
    const key = normalizePlate(item.vehicle.plate);
    if (!key || registry.has(key)) return;

    registry.set(key, {
      brand: item.vehicle.brand,
      model: item.vehicle.model,
      plate: item.vehicle.plate,
      vehicleType: item.vehicle.type,
      vehicleUse: item.vehicle.usage,
      paint: item.vehicle.paint,
    });
  });

  return registry;
}

function getWorkshopInfo(label) {
  return WORKSHOPS.find((workshop) => workshop.label === label);
}

function hasVehicleCoreData(vehicle) {
  return Boolean(vehicle.brand && vehicle.model && vehicle.plate && vehicle.type && vehicle.usage && vehicle.paint && vehicle.year && vehicle.color);
}

function getVehicleFieldMissing(vehicle) {
  const missing = [];

  if (!vehicle.brand) missing.push('marca');
  if (!vehicle.model) missing.push('modelo');
  if (!vehicle.plate) missing.push('dominio');
  if (!vehicle.type) missing.push('tipo');
  if (!vehicle.usage) missing.push('uso');
  if (!vehicle.paint) missing.push('pintura');
  if (!vehicle.year) missing.push('año');
  if (!vehicle.color) missing.push('color');

  return missing;
}

function initialCases() {
  return [
    {
      id: crypto.randomUUID(),
      code: '0001PZ',
      counter: 1,
      claimNumber: '833612',
      branch: 'Zapata',
      createdAt: '2026-03-12',
      folderCreated: true,
      customer: {
        firstName: 'Juan',
        lastName: 'Perez',
        phone: '3413505050',
        document: '16325547',
        locality: 'Rosario',
        email: 'jperez@email.com',
        referenced: 'NO',
        referencedName: '',
      },
      vehicle: {
        brand: 'Chevrolet',
        model: 'Astra',
        plate: 'AA365BE',
        type: 'Sedan',
        usage: 'Particular',
        paint: 'Bicapa',
        year: '2012',
        color: 'Negro',
      },
      vehicleMedia: [
        createMediaItem({
          label: 'Daño frontal',
          description: 'Golpe principal sobre paragolpe y guardabarros.',
          url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1280&q=80',
          thumbnail: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=400&q=60',
        }),
        createMediaItem({
          label: 'Recorrido lateral',
          type: 'video',
          description: 'Video corto para mostrar alineación lateral derecha.',
          url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
          thumbnail: 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=400&q=60',
        }),
        createMediaItem({
          label: 'Detalle óptica',
          description: 'Fisura completa sobre óptica derecha.',
          url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1280&q=80&sat=-80',
          thumbnail: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=400&q=60&sat=-80',
        }),
      ],
      budget: createBudgetDefaults({
        workshop: 'Taller Zapata',
        reportStatus: 'Informe cerrado',
        authorizer: 'PABLO ZAPATA',
        laborWithoutVat: 1200000,
        generated: true,
        lines: [
          createBudgetLine({ piece: 'Guardabarro delantero derecho', task: 'REEMPLAZAR Y PINTAR', damageLevel: 'Daño fuerte (+ 25%)', replacementDecision: 'Debe reemplazarse', action: 'Reemplazar', partPrice: '250000' }),
          createBudgetLine({ piece: 'Paragolpe delantero', task: 'REEMPLAZAR Y PINTAR', damageLevel: 'Daño fuerte (+ 25%)', replacementDecision: 'Puede repararse', action: 'Reemplazar', partPrice: '650000' }),
          createBudgetLine({ piece: 'Óptica delantera derecha', task: 'REEMPLAZAR', damageLevel: 'Daño medio (8 a 25%)', replacementDecision: 'A verificar', action: 'Reemplazar', partPrice: '450000' }),
        ],
        services: [
          createBudgetService('Estiraje en bancada', { status: 'SI', detail: 'parte delantera' }),
          createBudgetService('Alineación', { status: 'NO' }),
          createBudgetService('Balanceo', { status: 'NO' }),
          createBudgetService('Recambio cristales', { status: 'SI', detail: 'cristal de puerta delantera derecha' }),
          createBudgetService('Trabajos sobre sist. eléctrico', { status: 'NO' }),
          createBudgetService('Trabajos de mecánicas', { status: 'A/V' }),
        ],
        partsQuotedDate: '2026-03-12',
        partsProvider: 'Casa de Repuestos Fiat',
        estimatedWorkDays: '4',
        minimumLaborClose: '1000000',
      }),
      repair: {
        parts: [
          createRepairPart({ name: 'Guardabarro delantero derecho', provider: 'Casa Central', amount: '250000', state: 'Recibido', purchaseBy: 'Taller', paymentStatus: 'Cancelado', source: 'budget' }),
          createRepairPart({ name: 'Clip de fijacion frontal', provider: 'Autopartes Sur', amount: '28000', state: 'Recibido', purchaseBy: 'Taller', paymentStatus: 'Cancelado' }),
        ],
        turno: {
          date: '2026-03-15',
          estimatedDays: '4',
          state: 'Confirmado',
          notes: 'Cliente solicita aviso por WhatsApp antes del ingreso.',
        },
        ingreso: {
          realDate: '2026-03-15',
          hasObservation: 'SI',
          observation: 'Se detecta alineacion fina de capot.',
          items: [
            createIngresoItem({ type: 'Carrocería', detail: 'Abolladuras en capot y frente', media: 'Carpeta ingreso 01' }),
            createIngresoItem({ type: 'Accesorios', detail: 'Se recibe con moldura lateral floja', media: 'Video ingreso 02' }),
          ],
        },
        egreso: {
          date: '2026-03-20',
          notes: 'Entrega final sin novedades.',
          shouldReenter: 'NO',
          reentryDate: '',
          reentryEstimatedDays: '',
          reentryState: 'Pendiente',
          reentryNotes: '',
          definitiveExit: true,
          repairedPhotos: true,
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
          createSettlement({ kind: 'Parcial', amount: '150000', date: '2026-03-19', mode: 'Debito', gainsRetention: '0', ivaRetention: '0', dreiRetention: '0', employerContributionRetention: '0', iibbRetention: '0' }),
          createSettlement({ kind: 'Total', amount: '2680000', date: '2026-03-20', mode: 'Transferencia', gainsRetention: '7800', ivaRetention: '63478', dreiRetention: '2971', employerContributionRetention: '4571', iibbRetention: '0' }),
        ],
        invoice: 'SI',
        businessName: 'Talleres Zapata SRL',
        invoiceNumber: '0002-0002541',
      },
    },
    {
      id: crypto.randomUUID(),
      code: '0002PC',
      counter: 2,
      claimNumber: '43285410',
      branch: 'Centro',
      createdAt: '2026-03-16',
      folderCreated: true,
      customer: {
        firstName: 'Laura',
        lastName: 'Costa',
        phone: '3414020088',
        document: '27111444',
        locality: 'Rosario',
        email: 'lcosta@email.com',
        referenced: 'SI',
        referencedName: 'Marcelo Varela',
      },
      vehicle: {
        brand: 'Peugeot',
        model: '208',
        plate: 'AF514TR',
        type: 'Hatch',
        usage: 'Particular',
        paint: 'Perlado',
        year: '2020',
        color: 'Blanco nacarado',
      },
      vehicleMedia: [
        createMediaItem({
          label: 'Puerta izquierda',
          description: 'Puerta con hendidura y pérdida de pintura.',
          url: 'https://images.unsplash.com/photo-1507306305530-7d29b9d1ef10?auto=format&fit=crop&w=1280&q=80',
          thumbnail: 'https://images.unsplash.com/photo-1507306305530-7d29b9d1ef10?auto=format&fit=crop&w=400&q=60',
        }),
        createMediaItem({
          label: 'Zócalo',
          description: 'Vista inferior del zócalo lateral.',
          url: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1280&q=80',
          thumbnail: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=400&q=60',
        }),
      ],
      budget: createBudgetDefaults({
        workshop: 'Taller Casablanca',
        reportStatus: 'Informe cerrado',
        authorizer: 'MELINA ZAPATA',
        laborWithoutVat: 410000,
        generated: true,
        lines: [
          createBudgetLine({ piece: 'Puerta delantera izquierda', task: 'REEMPLAZAR', damageLevel: 'Daño fuerte (+ 25%)', replacementDecision: 'Debe reemplazarse', action: 'Reemplazar', partPrice: '0' }),
          createBudgetLine({ piece: 'Zócalo lateral', task: 'REPARAR Y PINTAR', damageLevel: 'Daño medio (8 a 25%)', replacementDecision: 'Puede repararse', action: 'Reparar', partPrice: '96000' }),
        ],
        services: [
          createBudgetService('Estiraje en bancada', { status: 'NO' }),
          createBudgetService('Alineación', { status: 'SI', detail: 'control post armado' }),
          createBudgetService('Balanceo', { status: 'NO' }),
          createBudgetService('Recambio cristales', { status: 'NO' }),
          createBudgetService('Trabajos sobre sist. eléctrico', { status: 'NO' }),
          createBudgetService('Trabajos de mecánicas', { status: 'A/V', detail: 'revisar burletes de puerta' }),
        ],
        partsQuotedDate: '2026-03-16',
        partsProvider: 'Repuestos Centro',
        estimatedWorkDays: '5',
        minimumLaborClose: '300000',
      }),
      repair: {
        parts: [
          createRepairPart({ name: 'Puerta delantera izquierda', provider: 'Repuestos Centro', amount: '0', state: 'Pedido', purchaseBy: 'Taller', paymentStatus: 'Pendiente', source: 'budget' }),
        ],
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
          shouldReenter: 'SI',
          reentryDate: '',
          reentryEstimatedDays: '',
          reentryState: 'Pendiente',
          reentryNotes: '',
          definitiveExit: false,
          repairedPhotos: false,
        },
      },
      payments: {
        comprobante: 'C',
        hasSena: 'SI',
        senaAmount: '80000',
        senaDate: '2026-03-16',
        senaMode: 'Otro',
        senaModeDetail: 'Link de pago enviado por caja',
        settlements: [createSettlement({ kind: 'Parcial', amount: '45000', date: '2026-03-17', mode: 'Transferencia', gainsRetention: '0', ivaRetention: '0', dreiRetention: '0', employerContributionRetention: '0', iibbRetention: '0' })],
        invoice: 'NO',
        businessName: '',
        invoiceNumber: '',
      },
    },
    {
      id: crypto.randomUUID(),
      code: '0003PZ',
      counter: 3,
      claimNumber: '0101024480',
      branch: 'Zapata',
      createdAt: '2026-03-18',
      folderCreated: true,
      customer: {
        firstName: 'Nicolas',
        lastName: 'Ruiz',
        phone: '3416203344',
        document: '30111888',
        locality: 'Funes',
        email: 'nruiz@email.com',
        referenced: 'NO',
        referencedName: '',
      },
      vehicle: {
        brand: 'Volkswagen',
        model: 'Nivus',
        plate: 'AG012ZX',
        type: 'SUV',
        usage: 'Particular',
        paint: 'Tricapa',
        year: '2023',
        color: 'Gris grafito',
      },
      vehicleMedia: [],
      budget: createBudgetDefaults({
        workshop: 'Taller Zapata',
        reportStatus: 'Informe abierto',
        authorizer: 'ENRIQUE ZAPATA',
        laborWithoutVat: 0,
        generated: false,
        lines: [createBudgetLine({ piece: 'Paragolpe trasero', task: '', damageLevel: '', replacementDecision: '', action: '', partPrice: '' })],
        estimatedWorkDays: '',
        minimumLaborClose: '',
      }),
      repair: {
        parts: [],
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
          shouldReenter: 'SI',
          reentryDate: '',
          reentryEstimatedDays: '',
          reentryState: 'Pendiente',
          reentryNotes: '',
          definitiveExit: false,
          repairedPhotos: false,
        },
      },
      payments: {
        comprobante: 'R',
        hasSena: 'NO',
        senaAmount: '',
        senaDate: '',
        senaMode: 'Transferencia',
        senaModeDetail: '',
        settlements: [],
        invoice: 'NO',
        businessName: '',
        invoiceNumber: '',
      },
    },
  ];
}

function money(value) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function numberValue(value) {
  const normalized = Number(String(value || '').replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(normalized) ? normalized : 0;
}

function formatDate(date) {
  if (!date) {
    return '-';
  }

  return new Intl.DateTimeFormat('es-AR').format(new Date(`${date}T12:00:00`));
}

function addBusinessDays(date, days) {
  if (!date || !days) {
    return '';
  }

  const next = new Date(`${date}T12:00:00`);
  let pending = Number(days);

  while (pending > 0) {
    next.setDate(next.getDate() + 1);
    const day = next.getDay();

    if (day !== 0 && day !== 6) {
      pending -= 1;
    }
  }

  return next.toISOString().slice(0, 10);
}

function maxDate(a, b) {
  if (!a) {
    return b;
  }
  if (!b) {
    return a;
  }
  return new Date(`${a}T12:00:00`) > new Date(`${b}T12:00:00`) ? a : b;
}

function isDateInRange(date, from, to) {
  if (!date) {
    return !from && !to;
  }

  const value = new Date(`${date}T12:00:00`).getTime();
  const min = from ? new Date(`${from}T00:00:00`).getTime() : Number.NEGATIVE_INFINITY;
  const max = to ? new Date(`${to}T23:59:59`).getTime() : Number.POSITIVE_INFINITY;
  return value >= min && value <= max;
}

function formatMonth(date) {
  if (!date) {
    return 'Sin fecha';
  }

  return new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' }).format(new Date(`${date}T12:00:00`));
}

function getBudgetServiceStatus(item, label) {
  return item.budget.services?.find((service) => service.label === label)?.status ?? 'NO';
}

function getBranchCode(branch) {
  return BRANCHES.find((item) => item.label === branch)?.code ?? 'Z';
}

function getFolderMissing(form) {
  const missing = [];

  if (!form.type) missing.push('tipo de tramite');
  if (!form.firstName) missing.push('nombre');
  if (!form.lastName) missing.push('apellido');
  if (!form.brand) missing.push('marca');
  if (!form.model) missing.push('modelo');
  if (!form.plate) missing.push('dominio');
  if (!form.referenced) missing.push('referenciado si/no');
  if (form.referenced === 'SI' && !form.referencedName) missing.push('nombre del referenciado');

  return missing;
}

function lineIsComplete(line) {
  return Boolean(line.piece && line.task && line.damageLevel);
}

function isReplacementTask(task) {
  return Boolean(task && task.startsWith('REEMPLAZAR'));
}

function lineNeedsReplacementDecision(line) {
  return isReplacementTask(line.task);
}

function getBudgetLineIssues(line) {
  const issues = [];

  if (!line.piece) issues.push('pieza afectada');
  if (!line.task) issues.push('tarea a ejecutar');
  if (!line.damageLevel) issues.push('nivel de dano');
  if (lineNeedsReplacementDecision(line) && !line.replacementDecision) {
    issues.push('decision interna de repuesto');
  }

  return issues;
}

function getBudgetAction(task) {
  if (!task) return '';
  if (task.startsWith('REEMPLAZAR')) return 'Reemplazar';
  if (task.startsWith('REPARAR')) return 'Reparar';
  if (task === 'CARGAR') return 'Cargar';
  if (task === 'DIFUMINAR') return 'Difuminar';
  if (task === 'ESCUADRAR') return 'Escuadrar';
  return 'Verificar';
}

function buildBudgetParts(lines) {
  return lines
    .filter((line) => line.piece && isReplacementTask(line.task))
    .map((line) => ({
      lineId: line.id,
      name: line.piece,
      task: line.task,
      damageLevel: line.damageLevel,
      replacementDecision: line.replacementDecision,
      amount: line.partPrice || '0',
    }));
}

function syncRepairPartsWithBudget(draft) {
  if (!draft.repair.removedBudgetLineIds) {
    draft.repair.removedBudgetLineIds = [];
  }

  const budgetParts = buildBudgetParts(draft.budget.lines);
  const validBudgetLineIds = new Set(budgetParts.map((part) => part.lineId));
  draft.repair.removedBudgetLineIds = draft.repair.removedBudgetLineIds.filter((lineId) => validBudgetLineIds.has(lineId));

  const removedBudgetLineIds = new Set(draft.repair.removedBudgetLineIds);
  const manualParts = draft.repair.parts.filter((part) => part.source !== 'budget');
  const existingBudgetParts = new Map(
    draft.repair.parts
      .filter((part) => part.source === 'budget' && part.sourceLineId)
      .map((part) => [part.sourceLineId, part]),
  );

  const syncedBudgetParts = budgetParts
    .filter((part) => !removedBudgetLineIds.has(part.lineId))
    .map((part) => {
      const existing = existingBudgetParts.get(part.lineId);

      if (!existing) {
        return createRepairPart({
          name: part.name,
          amount: part.amount,
          budgetAmount: part.amount,
          provider: draft.budget.partsProvider || '',
          source: 'budget',
          sourceLineId: part.lineId,
        });
      }

      return {
        ...existing,
        name: part.name,
        provider: existing.provider || draft.budget.partsProvider || '',
        amount: !existing.amount || existing.amount === existing.budgetAmount ? part.amount : existing.amount,
        budgetAmount: part.amount,
        source: 'budget',
        sourceLineId: part.lineId,
      };
    });

  draft.repair.parts = [...syncedBudgetParts, ...manualParts];
}

function getComputedCase(item) {
  const budgetServices = item.budget.services?.length ? item.budget.services : createBudgetDefaults().services;
  const ingresoItems = item.repair.ingreso.items?.length
    ? item.repair.ingreso.items
    : item.repair.ingreso.observation
      ? [createIngresoItem({ type: 'Otro', detail: item.repair.ingreso.observation, media: 'Migrado demo' })]
      : [];
  const partsTotal = item.budget.lines.reduce((sum, line) => sum + numberValue(line.partPrice), 0);
  const laborWithoutVat = numberValue(item.budget.laborWithoutVat);
  const laborVat = laborWithoutVat * 0.21;
  const laborWithVat = laborWithoutVat + laborVat;
  const usesVat = item.payments.comprobante === 'A';
  const totalQuoted = (usesVat ? laborWithVat : laborWithoutVat) + partsTotal;
  const repairPartsTotal = item.repair.parts.reduce((sum, part) => sum + numberValue(part.amount), 0);
  const senaAmount = item.payments.hasSena === 'SI' ? numberValue(item.payments.senaAmount) : 0;
  const settlementsTotal = item.payments.settlements.reduce((sum, settlement) => sum + numberValue(settlement.amount), 0);
  const totalRetentions = item.payments.settlements.reduce(
    (sum, settlement) => sum
      + numberValue(settlement.gainsRetention)
      + numberValue(settlement.ivaRetention)
      + numberValue(settlement.dreiRetention)
      + numberValue(settlement.employerContributionRetention)
      + numberValue(settlement.iibbRetention),
    0,
  );
  const paidAmount = senaAmount + settlementsTotal;
  const balance = Math.max(totalQuoted - paidAmount, 0);
  const incompleteBudgetLine = item.budget.lines.find((line) => !lineIsComplete(line));
  const pendingReplacementDecision = item.budget.lines.find(
    (line) => lineNeedsReplacementDecision(line) && !line.replacementDecision,
  );
  const reportClosed = item.budget.reportStatus === 'Informe cerrado';
  const hasVehicleData = hasVehicleCoreData(item.vehicle);
  const vehicleMissingFields = getVehicleFieldMissing(item.vehicle);
  const canGenerateBudget = Boolean(
    reportClosed
      && item.budget.lines.length
      && !incompleteBudgetLine
      && !pendingReplacementDecision
      && laborWithoutVat > 0
      && item.budget.workshop
      && hasVehicleData,
  );
  const budgetReady = canGenerateBudget && item.budget.generated;
  const budgetParts = buildBudgetParts(item.budget.lines);
  const budgetTotalWithVat = laborWithVat + partsTotal;
  const hasReplacementParts = budgetParts.length > 0;
  const allPartsReceived = hasReplacementParts
    ? budgetParts.every((source) => item.repair.parts.some((part) => part.name === source.name && part.state === 'Recibido'))
    : false;
  const turnoEstimatedExit = addBusinessDays(item.repair.turno.date, item.repair.turno.estimatedDays);
  const turnoReady = Boolean(item.repair.turno.date && item.repair.turno.estimatedDays && item.repair.turno.state && turnoEstimatedExit);
  const reentryEstimatedExit = addBusinessDays(item.repair.egreso.reentryDate, item.repair.egreso.reentryEstimatedDays);
  const repairResolved = item.folderCreated && (item.repair.egreso.shouldReenter === 'NO' || item.repair.egreso.definitiveExit);
  const estimatedReferenceDate = item.repair.egreso.reentryDate || turnoEstimatedExit || item.repair.egreso.date || item.createdAt;
  const paymentState = balance === 0 ? 'Total' : paidAmount > 0 ? 'Parcial' : 'Pendiente';

  let tramiteStatus = 'Ingresado';
  if (item.folderCreated) {
    tramiteStatus = 'Ingresado';
  }
  if (budgetReady && hasReplacementParts && allPartsReceived && !item.repair.turno.date) {
    tramiteStatus = 'Acordado';
  }
  if (budgetReady && !repairResolved && (item.repair.turno.date || item.repair.ingreso.realDate)) {
    tramiteStatus = 'En trámite';
  }
  if (repairResolved && balance > 0) {
    tramiteStatus = 'Pasado a pagos';
  }
  if (repairResolved && balance === 0) {
    tramiteStatus = 'Pagado';
  }

  let repairStatus = item.folderCreated ? 'En trámite' : 'En trámite';
  if (item.folderCreated && item.payments.comprobante) {
    repairStatus = 'Dar Turno';
  }
  if (budgetReady && hasReplacementParts && !allPartsReceived) {
    repairStatus = 'Faltan repuestos';
  }
  if (budgetReady && !hasReplacementParts) {
    repairStatus = 'No debe repararse';
  }
  if (budgetReady && item.repair.turno.date) {
    repairStatus = 'Con Turno';
  }
  if (item.repair.egreso.shouldReenter === 'SI' && item.repair.egreso.date) {
    repairStatus = 'Debe reingresar';
  }
  if (repairResolved) {
    repairStatus = 'Reparado';
  }

  const closeReady = repairResolved && balance === 0;
  const latestPaymentDate = item.payments.settlements.reduce((latest, settlement) => maxDate(latest, settlement.date), item.payments.senaDate);
  const closeDate = closeReady ? maxDate(item.repair.egreso.date || item.repair.egreso.reentryDate, latestPaymentDate) : '';
  const blockers = [];

  if (!item.folderCreated) {
    blockers.push('No hay carpeta generada: faltan minimos obligatorios del caso particular.');
  }
  if (!budgetReady) {
    blockers.push(reportClosed ? 'Presupuesto listo pero falta generar el documento final.' : 'Presupuesto incompleto o en rojo: Gestion reparacion permanece bloqueada.');
  }
  if (item.budget.lines.length && incompleteBudgetLine) {
    blockers.push('Hay lineas de presupuesto sin pieza afectada, tarea a ejecutar o nivel de dano.');
  }
  if (pendingReplacementDecision) {
    blockers.push('Cada linea con tarea REEMPLAZAR debe definir la decision interna de repuesto antes de cerrar el informe.');
  }
  if (!canGenerateBudget) {
    blockers.push('No se puede generar presupuesto si el informe no esta completo y cerrado.');
  }
  if (!item.budget.workshop) {
    blockers.push('Selecciona el taller antes de cerrar y generar el presupuesto.');
  }
  if (!hasVehicleData) {
    blockers.push('Completa la ficha tecnica del vehiculo antes de cerrar el informe.');
  }
  if (!item.budget.authorizer) {
    blockers.push('Falta autorizante del presupuesto particular.');
  }
  if (!item.budget.estimatedWorkDays) {
    blockers.push('Faltan dias de trabajo estimado del presupuesto.');
  }
  if (!turnoReady && budgetReady) {
    blockers.push('No se puede agendar turno sin fecha, dias estimados, salida estimada y estado.');
  }
  if (!closeReady) {
    blockers.push('El caso no cierra hasta tener salida definitiva/no reingreso y pago total.');
  }
  if (item.payments.hasSena === 'SI' && (!item.payments.senaAmount || !item.payments.senaDate || !item.payments.senaMode)) {
    blockers.push('Seña en SI exige monto, fecha y modo de pago.');
  }
  if (item.payments.senaMode === 'Otro' && !item.payments.senaModeDetail) {
    blockers.push('Modo de pago Otro exige detalle.');
  }
  if (item.payments.invoice === 'SI' && (!item.payments.businessName || !item.payments.invoiceNumber)) {
    blockers.push('Factura en SI exige razon social y numero.');
  }
  if (item.payments.settlements.some((settlement) => settlement.mode === 'Otro' && !settlement.modeDetail)) {
    blockers.push('Cada cobro con modo Otro requiere detalle obligatorio.');
  }
  if (item.payments.settlements.some((settlement) => settlement.kind === 'Bonificacion' && (!settlement.amount || !settlement.date || !settlement.reason))) {
    blockers.push('Bonificacion exige monto, fecha y motivo.');
  }
  if (item.repair.ingreso.hasObservation === 'SI' && !ingresoItems.length) {
    blockers.push('Ingreso marcado con observaciones pero sin items cargados.');
  }

  let urgency = 0;
  if (!item.folderCreated) urgency += 5;
  if (!budgetReady) urgency += 4;
  if (budgetReady && !turnoReady) urgency += 3;
  if (balance > 0) urgency += 3;
  if (hasReplacementParts && !allPartsReceived) urgency += 2;

  const presupuestoTabState = budgetReady ? 'resolved' : reportClosed || canGenerateBudget ? 'advanced' : 'pending';
  const gestionTabState = repairResolved ? 'resolved' : reportClosed ? 'advanced' : 'pending';

  return {
    ...item,
    computed: {
      budgetParts,
      partsTotal,
      repairPartsTotal,
      laborWithoutVat,
      laborVat,
      laborWithVat,
      budgetTotalWithVat,
      totalQuoted,
      paidAmount,
      balance,
      totalRetentions,
      paymentState,
      canGenerateBudget,
      budgetReady,
      hasReplacementParts,
      allPartsReceived,
      partsStatus: hasReplacementParts ? (allPartsReceived ? 'Recibido' : 'Pendiente') : 'Sin repuestos',
      budgetServices,
      ingresoItems,
      turnoEstimatedExit,
      turnoReady,
      reentryEstimatedExit,
      estimatedReferenceDate,
      repairResolved,
      closeReady,
      closeDate,
      tramiteStatus,
      repairStatus,
      blockers,
      pendingTasksCount: blockers.length,
      urgency,
      reportClosed,
      hasVehicleData,
      vehicleMissingFields,
      pendingReplacementDecision,
      tabs: {
        ficha: item.folderCreated ? 'advanced' : 'pending',
        presupuesto: presupuestoTabState,
        gestion: gestionTabState,
        pagos: balance === 0 ? 'resolved' : paidAmount > 0 ? 'advanced' : 'pending',
      },
    },
  };
}

function StatusBadge({ tone, children }) {
  return <span className={`status-badge ${tone}`}>{children}</span>;
}

function TabButton({ active, state, children, onClick }) {
  return (
    <button className={`tab-button is-${state} ${active ? 'is-active' : ''}`} onClick={onClick} type="button">
      {children}
    </button>
  );
}

function FieldLabel({ label, required = false }) {
  return (
    <span>
      {label}
      {required ? <em className="required-indicator" aria-hidden="true">*</em> : null}
    </span>
  );
}

function DataField({ label, value, onChange, type = 'text', placeholder = '', required = false, invalid = false, readOnly = false, inputMode, highlighted = false }) {
  return (
    <label className={`field ${invalid ? 'is-invalid' : ''} ${highlighted ? 'is-autofilled' : ''}`}>
      <FieldLabel label={label} required={required} />
      <input inputMode={inputMode} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} readOnly={readOnly} type={type} value={value} />
    </label>
  );
}

function SelectField({ label, value, onChange, options, required = false, invalid = false, highlighted = false, placeholder = '' }) {
  const normalizedOptions = options
    .map((option) => (typeof option === 'string' ? { value: option, label: option || '—' } : option))
    .filter((option) => !(placeholder && (option.value ?? option.label) === ''));
  const resolvedValue = value ?? '';

  return (
    <label className={`field ${invalid ? 'is-invalid' : ''} ${highlighted ? 'is-autofilled' : ''}`}>
      <FieldLabel label={label} required={required} />
      <select onChange={(event) => onChange(event.target.value)} value={resolvedValue}>
        {placeholder ? (
          <option value="">
            {placeholder}
          </option>
        ) : null}
        {normalizedOptions.map((option) => {
          const optionValue = option.value ?? option.label;
          return (
            <option key={optionValue} value={optionValue}>
              {option.label}
            </option>
          );
        })}
      </select>
    </label>
  );
}

function ToggleField(props) {
  return <SelectField {...props} options={['', 'SI', 'NO']} />;
}

function getStatusTone(status) {
  if (['Pagado', 'Reparado'].includes(status)) return 'success';
  if (['Pasado a pagos', 'Con Turno', 'En trámite', 'Acordado', 'Recibido', 'Parcial'].includes(status)) return 'info';
  return 'danger';
}

function getBudgetPendingMeta(item) {
  const incompleteBudgetLine = item.budget.lines.find((line) => !lineIsComplete(line));

  if (!item.budget.workshop) {
    return {
      reason: 'Definir taller del presupuesto',
      status: 'Selecciona el taller asignado antes de avanzar',
    };
  }

  if (!item.computed.hasVehicleData) {
    const missing = item.computed.vehicleMissingFields.join(', ');
    return {
      reason: 'Completar datos del vehiculo',
      status: missing ? `Falta ${missing}` : 'Revisar ficha tecnica',
    };
  }

  if (item.budget.reportStatus !== 'Informe cerrado') {
    return {
      reason: 'Cerrar informe de presupuesto',
      status: 'El informe sigue abierto y bloquea la emisión',
    };
  }

  if (incompleteBudgetLine) {
    return {
      reason: 'Completar líneas del presupuesto',
      status: 'Falta pieza, tarea o nivel de daño obligatorio',
    };
  }

  if (item.computed.pendingReplacementDecision) {
    return {
      reason: 'Definir decisión interna de repuesto',
      status: 'Cada línea REEMPLAZAR debe indicar si reemplaza o puede repararse',
    };
  }

  if (!numberValue(item.budget.laborWithoutVat)) {
    return {
      reason: 'Definir mano de obra del presupuesto',
      status: 'Falta cargar mano de obra sin IVA para emitir',
    };
  }

  if (!item.budget.generated) {
    return {
      reason: 'Emitir presupuesto cerrado',
      status: 'El informe ya está listo, resta generar el presupuesto',
    };
  }

  return {
    reason: 'Revisar bloqueo de presupuesto',
    status: 'Presupuesto todavía sin habilitar Gestión reparación',
  };
}

function getTurnoPendingMeta(item) {
  const missing = [];

  if (!item.repair.turno.date) missing.push('fecha');
  if (!item.repair.turno.estimatedDays) missing.push('días');
  if (!item.computed.turnoEstimatedExit) missing.push('salida estimada');
  if (!item.repair.turno.state) missing.push('estado');

  return {
    reason: 'Asignar turno de reparación',
    status: missing.length
      ? `Falta ${missing.join(', ')} para agendar`
      : item.repair.turno.state || 'Agenda pendiente',
  };
}

function getPartsPendingMeta(item) {
  const pendingParts = item.repair.parts.filter((part) => part.state !== 'Recibido');

  return {
    reason: 'Completar repuestos para iniciar',
    status: pendingParts.length
      ? `${pendingParts.length} repuesto(s) siguen sin recibir`
      : 'Todavía hay repuestos pendientes',
  };
}

function getReentryPendingMeta(item) {
  return {
    reason: 'Resolver reingreso o egreso definitivo',
    status: item.repair.egreso.reentryDate
      ? `Reingreso previsto para ${formatDate(item.repair.egreso.reentryDate)}`
      : 'Falta definir fecha y salida del reingreso',
  };
}

function getPaymentFilterDate(item, type) {
  if (type === 'Fecha estimada') return item.computed.estimatedReferenceDate;
  if (type === 'Fecha de cierre') return item.computed.closeDate;
  if (type === 'Fecha de cobro') {
    return item.payments.settlements.reduce((latest, settlement) => maxDate(latest, settlement.date), item.payments.senaDate);
  }
  return item.createdAt;
}

function getPendingPriorityMeta(item) {
  const hasIncompleteBudget = !item.computed.budgetReady;
  const missingTurno = item.computed.budgetReady && !item.computed.turnoReady;
  const pendingParts = item.computed.hasReplacementParts && !item.computed.allPartsReceived;
  const needsReentry = item.computed.repairStatus === 'Debe reingresar';

  if (missingTurno) {
    const turnoMeta = getTurnoPendingMeta(item);
    return {
      score: 120,
      attention: 'danger',
      attentionLabel: 'Urge',
      reason: turnoMeta.reason,
      status: turnoMeta.status,
      target: { tab: 'gestion', subtab: 'turno' },
      routeLabel: 'Gestión > Turno',
    };
  }

  if (hasIncompleteBudget) {
    const budgetMeta = getBudgetPendingMeta(item);
    return {
      score: 110,
      attention: 'danger',
      attentionLabel: 'Urge',
      reason: budgetMeta.reason,
      status: budgetMeta.status,
      target: { tab: 'presupuesto' },
      routeLabel: 'Presupuesto',
    };
  }

  if (pendingParts) {
    const partsMeta = getPartsPendingMeta(item);
    return {
      score: 100,
      attention: 'danger',
      attentionLabel: 'Urge',
      reason: partsMeta.reason,
      status: partsMeta.status,
      target: { tab: 'gestion', subtab: 'repuestos' },
      routeLabel: 'Gestión > Repuestos',
    };
  }

  if (needsReentry) {
    const reentryMeta = getReentryPendingMeta(item);
    return {
      score: 90,
      attention: 'danger',
      attentionLabel: 'Reingreso',
      reason: reentryMeta.reason,
      status: reentryMeta.status,
      target: { tab: 'gestion', subtab: 'egreso' },
      routeLabel: 'Gestión > Egreso',
    };
  }

  return {
    score: item.computed.urgency,
    attention: item.computed.pendingTasksCount > 0 ? 'danger' : 'info',
    attentionLabel: item.computed.pendingTasksCount > 0 ? 'Atender' : 'OK',
    reason: item.computed.blockers[0] ? 'Resolver bloqueo activo del caso' : 'Seguimiento operativo del caso',
    status: item.computed.blockers[0] || (item.computed.repairStatus === 'En trámite' ? 'Caso en curso' : item.computed.repairStatus),
    target: { tab: 'ficha' },
    routeLabel: 'Ficha técnica',
  };
}

function getCaseHash(id, target = {}) {
  const resolvedTab = CASE_TABS.includes(target.tab) ? target.tab : '';
  const resolvedRepairTab = resolvedTab === 'gestion' && REPAIR_TABS.includes(target.subtab) ? target.subtab : '';

  return `#/caso/${id}${resolvedTab ? `/${resolvedTab}` : ''}${resolvedRepairTab ? `/${resolvedRepairTab}` : ''}`;
}

function getCaseRouteFromHash(hash) {
  const match = hash.match(/^#\/caso\/([^/]+)(?:\/([^/]+))?(?:\/([^/]+))?$/);

  return {
    id: match?.[1] ?? '',
    tab: CASE_TABS.includes(match?.[2]) ? match[2] : '',
    subtab: REPAIR_TABS.includes(match?.[3]) ? match[3] : '',
  };
}

function collectPaymentEvents(items) {
  return items.flatMap((item) => {
    const events = [];

    if (item.payments.hasSena === 'SI' && item.payments.senaDate && item.payments.senaAmount) {
      events.push({
        id: `${item.id}-sena`,
        type: 'Seña',
        date: item.payments.senaDate,
        amount: numberValue(item.payments.senaAmount),
        gainsRetention: 0,
        ivaRetention: 0,
        dreiRetention: 0,
        employerContributionRetention: 0,
        iibbRetention: 0,
        caseCode: item.code,
        customerName: `${item.customer.lastName}, ${item.customer.firstName}`,
        folderName: `${item.customer.lastName}, ${item.customer.firstName} - ${item.vehicle.brand} ${item.vehicle.model}`,
        repairStatus: item.computed.repairStatus,
        tramiteStatus: item.computed.tramiteStatus,
      });
    }

    item.payments.settlements.forEach((settlement) => {
      if (!settlement.date || !settlement.amount) {
        return;
      }

      events.push({
        id: settlement.id,
        type: settlement.kind,
        date: settlement.date,
        amount: numberValue(settlement.amount),
        gainsRetention: numberValue(settlement.gainsRetention),
        ivaRetention: numberValue(settlement.ivaRetention),
        dreiRetention: numberValue(settlement.dreiRetention),
        employerContributionRetention: numberValue(settlement.employerContributionRetention),
        iibbRetention: numberValue(settlement.iibbRetention),
        caseCode: item.code,
        customerName: `${item.customer.lastName}, ${item.customer.firstName}`,
        folderName: `${item.customer.lastName}, ${item.customer.firstName} - ${item.vehicle.brand} ${item.vehicle.model}`,
        repairStatus: item.computed.repairStatus,
        tramiteStatus: item.computed.tramiteStatus,
      });
    });

    return events;
  });
}

function triggerDownload(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeCsvValue(value) {
  const normalized = String(value ?? '').replace(/"/g, '""');
  return `"${normalized}"`;
}

function buildPanelExportRows(items) {
  return items.map((item) => ({
    carpeta: item.code,
    siniestro: item.claimNumber || '',
    cliente: `${item.customer.lastName}, ${item.customer.firstName}`,
    vehiculo: `${item.vehicle.brand} ${item.vehicle.model}`,
    dominio: item.vehicle.plate,
    tramite: item.computed.tramiteStatus,
    reparacion: item.computed.repairStatus,
    pagos: item.computed.paymentState,
    tareasPendientes: item.computed.pendingTasksCount,
    fechaEstimada: item.computed.estimatedReferenceDate,
    saldo: item.computed.balance,
    totalCotizado: item.computed.totalQuoted,
  }));
}

function PanelGeneral({ items, onOpenCase }) {
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState(TRAMITE_TYPES[0]);
  const [taskFilter, setTaskFilter] = useState('Todos');

  const visibleItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return items
      .filter((item) => {
        const haystack = [
          item.code,
          item.claimNumber,
          item.customer.firstName,
          item.customer.lastName,
          item.vehicle.plate,
          item.vehicle.brand,
          item.vehicle.model,
        ].join(' ').toLowerCase();

        if (normalizedQuery && !haystack.includes(normalizedQuery)) return false;
        if (taskFilter === 'Con pendientes' && item.computed.pendingTasksCount === 0) return false;
        if (taskFilter === 'Sin pendientes' && item.computed.pendingTasksCount > 0) return false;

        return true;
      })
      .sort((a, b) => {
        const aOpen = a.computed.closeReady ? 1 : 0;
        const bOpen = b.computed.closeReady ? 1 : 0;
        return aOpen - bOpen || b.computed.urgency - a.computed.urgency || a.counter - b.counter;
      });
  }, [items, query, taskFilter]);

  const openItems = visibleItems.filter((item) => !item.computed.closeReady);
  const closedItems = visibleItems.filter((item) => item.computed.closeReady);
  const pendingTaskItems = openItems.filter((item) => item.computed.pendingTasksCount > 0);
  const highlightedPendingItems = [...pendingTaskItems]
    .sort((a, b) => {
      const aPriority = getPendingPriorityMeta(a);
      const bPriority = getPendingPriorityMeta(b);
      return bPriority.score - aPriority.score || b.computed.urgency - a.computed.urgency || a.counter - b.counter;
    })
    .slice(0, 3);
  const prioritizedOpenItems = openItems.slice(0, 6);
  const typeCounts = TRAMITE_TYPES.reduce((accumulator, type) => {
    accumulator[type] = openItems.filter((item) => (item.tramiteType ?? 'Particular') === type).length;
    return accumulator;
  }, {});
  const selectedTypeTotal = typeCounts[selectedType] ?? 0;
  const selectedTypeItems = openItems.filter(
    (item) => (item.tramiteType ?? 'Particular') === selectedType && item.computed.pendingTasksCount > 0,
  );
  const selectedTypeHasData = selectedTypeTotal > 0;

  const handleOpenCase = (itemId, target) => onOpenCase(itemId, target);

  const handleRowKeyDown = (event, itemId) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleOpenCase(itemId);
    }
  };

    return (
      <div className="page-stack">
        <section className="hero-panel compact-hero panel-simple-hero">
          <div className="stack-tight">
            <h1>Panel general</h1>
          </div>
        </section>

      <section className="card pending-board simple-panel-section">
          <div className="section-head">
            <div className="stack-tight">
              <h2>Tareas pendientes</h2>
          </div>
          <StatusBadge tone={highlightedPendingItems.length ? 'danger' : 'success'}>
            {highlightedPendingItems.length ? `${highlightedPendingItems.length} casos` : 'Sin pendientes críticas'}
          </StatusBadge>
        </div>

        {highlightedPendingItems.length ? (
          <div className="pending-board-grid priority-grid">
            {highlightedPendingItems.map((item, index) => {
              const priority = getPendingPriorityMeta(item);

              return (
               <button className="pending-case priority-case" key={item.id} onClick={() => handleOpenCase(item.id, priority.target)} type="button">
                <div className="priority-case-head">
                  <span className="priority-index">0{index + 1}</span>
                  <StatusBadge tone={priority.attention}>{priority.attentionLabel}</StatusBadge>
                </div>
                <div className="priority-identity">
                  <strong>{item.code}</strong>
                  <span>{item.customer.lastName}, {item.customer.firstName}</span>
                  <span>{item.vehicle.brand} {item.vehicle.model} - {item.vehicle.plate}</span>
                </div>
                <div className="priority-detail-grid">
                  <div className="priority-detail-card is-critical">
                    <span>Motivo</span>
                    <strong>{priority.reason}</strong>
                  </div>
                  <div className="priority-detail-card">
                    <span>Estado</span>
                    <strong>{priority.status}</strong>
                  </div>
                </div>
                <div className="tag-row priority-tag-row">
                  <StatusBadge tone={getStatusTone(item.computed.tramiteStatus)}>{item.computed.tramiteStatus}</StatusBadge>
                  <StatusBadge tone={getStatusTone(item.computed.repairStatus)}>{item.computed.repairStatus}</StatusBadge>
                </div>
                 <div className="priority-link-row" aria-hidden="true">
                   <span>Abrir directo</span>
                   <strong>{priority.routeLabel}</strong>
                 </div>
               </button>
              );
            })}
          </div>
        ) : (
          <div className="empty-state muted">No hay tareas pendientes dentro del filtro actual.</div>
        )}
      </section>

      <section className="card simple-panel-section">
          <div className="section-head">
            <div className="stack-tight">
              <h2>Priorizados</h2>
          </div>
          <StatusBadge tone="info">{openItems.length} abiertos</StatusBadge>
        </div>

        <div className="table-wrap">
          <table className="data-table compact-table clickable-table">
            <thead>
              <tr>
                <th>Carpeta</th>
                <th>Cliente</th>
                <th>Patente</th>
                <th>Trámite</th>
                <th>Reparación</th>
                <th>Pendientes</th>
              </tr>
            </thead>
            <tbody>
              {prioritizedOpenItems.map((item) => (
                <tr className={item.computed.pendingTasksCount ? 'row-danger' : ''} key={item.id} onClick={() => handleOpenCase(item.id)} onKeyDown={(event) => handleRowKeyDown(event, item.id)} tabIndex={0}>
                  <td><strong>{item.code}</strong></td>
                  <td>{item.customer.lastName}, {item.customer.firstName}</td>
                  <td>{item.vehicle.plate}</td>
                  <td><StatusBadge tone={getStatusTone(item.computed.tramiteStatus)}>{item.computed.tramiteStatus}</StatusBadge></td>
                  <td><StatusBadge tone={getStatusTone(item.computed.repairStatus)}>{item.computed.repairStatus}</StatusBadge></td>
                  <td>{item.computed.pendingTasksCount}</td>
                </tr>
              ))}
              {!prioritizedOpenItems.length ? (
                <tr>
                  <td colSpan="6">No hay carpetas abiertas con los filtros elegidos.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card filters-card">
          <div className="section-head">
            <div className="stack-tight">
              <h2>Buscar</h2>
          </div>
          <StatusBadge tone="info">{visibleItems.length} visibles</StatusBadge>
        </div>

        <div className="form-grid simple-filter-grid">
          <label className="search-box field">
            <span>Buscar cliente, patente, carpeta o siniestro</span>
            <input onChange={(event) => setQuery(event.target.value)} placeholder="Ej: Perez, AA365BE, 0002PC" value={query} />
          </label>
          <SelectField label="Tareas pendientes" onChange={setTaskFilter} options={PANEL_TASK_FILTERS} value={taskFilter} />
        </div>
      </section>

      <section className="card grouped-section simple-panel-section">
          <div className="section-head">
            <div className="stack-tight">
              <h2>Tipos de trámite</h2>
          </div>
          <StatusBadge tone="info">{selectedTypeTotal} abiertos</StatusBadge>
        </div>

        <div className="tramite-type-shell" role="tablist" aria-label="Tipos de trámites">
          {TRAMITE_TYPES.map((type) => (
            <button
              aria-selected={selectedType === type}
              className={`tramite-type-chip ${selectedType === type ? 'is-active' : ''}`}
              key={type}
              onClick={() => setSelectedType(type)}
              role="tab"
              type="button"
            >
              <span>{type}</span>
              <strong>{typeCounts[type] ?? 0}</strong>
            </button>
          ))}
        </div>

        <div className="tramite-type-panel">
          <div className="section-head tramite-type-summary">
            <div className="stack-tight">
              <h2>{selectedType}</h2>
            </div>
            <StatusBadge tone={selectedTypeItems.length ? 'info' : 'success'}>
              {selectedTypeHasData ? `${selectedTypeItems.length} con pendiente` : 'Sin casos cargados'}
            </StatusBadge>
          </div>

          {selectedTypeHasData ? (
            <div className="table-wrap">
              <table className="data-table compact-table clickable-table">
                <thead>
                  <tr>
                    <th>Carpeta</th>
                    <th>Cliente</th>
                    <th>Patente</th>
                    <th>Estado del trámite</th>
                    <th>Estado de reparación</th>
                    <th>Pendientes</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedTypeItems.map((item) => (
                    <tr className={item.computed.pendingTasksCount ? 'row-danger' : ''} key={item.id} onClick={() => handleOpenCase(item.id)} onKeyDown={(event) => handleRowKeyDown(event, item.id)} tabIndex={0}>
                      <td><strong>{item.code}</strong></td>
                      <td>{item.customer.lastName}, {item.customer.firstName}</td>
                      <td>{item.vehicle.plate}</td>
                      <td><StatusBadge tone={getStatusTone(item.computed.tramiteStatus)}>{item.computed.tramiteStatus}</StatusBadge></td>
                      <td><StatusBadge tone={getStatusTone(item.computed.repairStatus)}>{item.computed.repairStatus}</StatusBadge></td>
                      <td>{item.computed.pendingTasksCount}</td>
                    </tr>
                  ))}
                  {!selectedTypeItems.length ? (
                    <tr>
                      <td colSpan="6">No hay trámites pendientes para {selectedType} dentro del filtro actual.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="tramite-type-empty" role="status">
              <strong>{selectedType}</strong>
              <p>Sin casos cargados.</p>
            </div>
          )}
        </div>
      </section>

      <section className="card simple-panel-section">
          <div className="section-head">
            <div className="stack-tight">
              <h2>Cerrados</h2>
          </div>
          <StatusBadge tone="success">{closedItems.length}</StatusBadge>
        </div>

        <div className="table-wrap">
          <table className="data-table compact-table">
            <thead>
              <tr>
                <th>Carpeta</th>
                <th>Cliente</th>
                <th>Cierre</th>
                <th>Reparación</th>
              </tr>
            </thead>
            <tbody>
              {closedItems.map((item) => (
                <tr key={item.id} onClick={() => handleOpenCase(item.id)} onKeyDown={(event) => handleRowKeyDown(event, item.id)} tabIndex={0}>
                  <td><strong>{item.code}</strong></td>
                  <td>{item.customer.lastName}, {item.customer.firstName}</td>
                  <td>{formatDate(item.computed.closeDate)}</td>
                  <td>{item.computed.repairStatus}</td>
                </tr>
              ))}
              {!closedItems.length ? (
                <tr>
                  <td colSpan="4">Todavía no hay carpetas cerradas dentro del filtro.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function NuevoCaso({
  form,
  onChange,
  onCreate,
  nextCode,
  missing,
  showValidation,
  customerLookupState,
  vehicleLookupState,
  onSearchDocument,
  onSearchPlate,
  autofilledFields,
}) {
  const fieldHasError = (field) => showValidation && missing.includes(field);
  const fieldWasAutofilled = (field) => autofilledFields.includes(field);
  const customerTone = customerLookupState.status === 'found' ? 'success' : customerLookupState.status === 'empty' ? 'danger' : 'info';
  const vehicleTone = vehicleLookupState.status === 'found' ? 'success' : vehicleLookupState.status === 'empty' ? 'danger' : 'info';

  return (
    <div className="page-stack">
      <section className="hero-panel compact-hero">
        <div className="stack-tight">
          <p className="eyebrow">Nuevo Caso</p>
          <h1>Alta de caso particular</h1>
          <p className="muted">Completá los datos mínimos y generá la carpeta.</p>
        </div>
        <div className="tag-row">
          <StatusBadge tone="info">Carpeta automática</StatusBadge>
          <StatusBadge tone={missing.length ? 'danger' : 'success'}>{nextCode}</StatusBadge>
        </div>
      </section>

      <section className="content-grid single-column">
        <article className="card nuevo-caso-card">
          <div className="section-head nuevo-caso-head">
            <div className="stack-tight nuevo-caso-title-group">
              <p className="eyebrow">Minimos obligatorios</p>
              <h2>Datos para generar carpeta</h2>
            </div>
            <StatusBadge tone={missing.length ? 'danger' : 'success'}>
              {missing.length ? 'Completar datos' : 'Listo para generar'}
            </StatusBadge>
          </div>

          <div className="lookup-grid nuevo-caso-lookups">
            <div className={`lookup-card ${customerLookupState.status === 'found' ? 'is-found' : ''}`}>
              <div className="lookup-head">
                <div className="stack-tight">
                  <p className="eyebrow">Cliente</p>
                  <h3>Buscar por DNI</h3>
                </div>
                {customerLookupState.message ? <StatusBadge tone={customerTone}>{customerLookupState.message}</StatusBadge> : null}
              </div>
              <div className="lookup-form">
                <DataField
                  highlighted={fieldWasAutofilled('document')}
                  label="DNI"
                  onChange={(value) => onChange('document', normalizeDocument(value))}
                  placeholder="Ej: 30111888"
                  value={form.document}
                  inputMode="numeric"
                />
                <button className="secondary-button" onClick={onSearchDocument} type="button">Buscar DNI</button>
              </div>
              {customerLookupState.detail ? <p className="lookup-detail">{customerLookupState.detail}</p> : null}
            </div>

            <div className={`lookup-card ${vehicleLookupState.status === 'found' ? 'is-found' : ''}`}>
              <div className="lookup-head">
                <div className="stack-tight">
                  <p className="eyebrow">Vehículo</p>
                  <h3>Buscar por patente</h3>
                </div>
                {vehicleLookupState.message ? <StatusBadge tone={vehicleTone}>{vehicleLookupState.message}</StatusBadge> : null}
              </div>
              <div className="lookup-form">
                <DataField
                  highlighted={fieldWasAutofilled('plate')}
                  label="Patente"
                  onChange={(value) => onChange('plate', normalizePlate(value))}
                  placeholder="Ej: AA365BE"
                  value={form.plate}
                  invalid={fieldHasError('dominio')}
                />
                <button className="secondary-button" onClick={onSearchPlate} type="button">Buscar patente</button>
              </div>
              {vehicleLookupState.detail ? <p className="lookup-detail">{vehicleLookupState.detail}</p> : null}
            </div>
          </div>

          <div className="auto-code-card nuevo-caso-code-card" role="status" aria-live="polite">
            <span>Identificador de carpeta</span>
            <strong>{nextCode}</strong>
          </div>

          <div className="form-grid three-columns nuevo-caso-form">
            <SelectField invalid={fieldHasError('tipo de tramite')} label="Tipo de tramite" onChange={(value) => onChange('type', value)} options={['Particular']} required value={form.type} />
            <SelectField label="Sucursal" onChange={(value) => onChange('branch', value)} options={BRANCHES.map((branch) => branch.label)} value={form.branch} />
            <DataField label="N° siniestro" onChange={(value) => onChange('claimNumber', value)} value={form.claimNumber} />
            <DataField highlighted={fieldWasAutofilled('firstName')} invalid={fieldHasError('nombre')} label="Nombre" onChange={(value) => onChange('firstName', value)} required value={form.firstName} />
            <DataField highlighted={fieldWasAutofilled('lastName')} invalid={fieldHasError('apellido')} label="Apellido" onChange={(value) => onChange('lastName', value)} required value={form.lastName} />
            <DataField highlighted={fieldWasAutofilled('phone')} label="Telefono" onChange={(value) => onChange('phone', value)} value={form.phone} />
            <DataField highlighted={fieldWasAutofilled('brand')} invalid={fieldHasError('marca')} label="Marca" onChange={(value) => onChange('brand', value)} required value={form.brand} />
            <DataField highlighted={fieldWasAutofilled('model')} invalid={fieldHasError('modelo')} label="Modelo" onChange={(value) => onChange('model', value)} required value={form.model} />
            <SelectField highlighted={fieldWasAutofilled('vehicleType')} label="Tipo vehiculo" onChange={(value) => onChange('vehicleType', value)} options={VEHICLE_TYPES} value={form.vehicleType} />
            <SelectField highlighted={fieldWasAutofilled('vehicleUse')} label="Uso" onChange={(value) => onChange('vehicleUse', value)} options={VEHICLE_USES} value={form.vehicleUse} />
            <SelectField highlighted={fieldWasAutofilled('paint')} label="Pintura" onChange={(value) => onChange('paint', value)} options={PAINT_TYPES} value={form.paint} />
            <ToggleField highlighted={fieldWasAutofilled('referenced')} invalid={fieldHasError('referenciado si/no')} label="Referenciado" onChange={(value) => onChange('referenced', value)} required value={form.referenced} />
            {form.referenced === 'SI' ? (
              <DataField highlighted={fieldWasAutofilled('referencedName')} invalid={fieldHasError('nombre del referenciado')} label="Nombre del referenciado" onChange={(value) => onChange('referencedName', value)} required value={form.referencedName} />
            ) : null}
          </div>

          <button className="primary-button" onClick={onCreate} type="button">
            Generar carpeta Particular
          </button>
        </article>
      </section>
    </div>
  );
}

function FichaTecnicaTab({ item, updateCase }) {
  const laborSummary = item.payments.comprobante === 'A' ? item.computed.laborWithVat : item.computed.laborWithoutVat;

  return (
    <div className="tab-layout">
      <div className="form-grid two-columns">
        <article className="card inner-card">
          <div className="section-head small-gap">
            <h3>Cliente</h3>
            <StatusBadge tone={item.customer.referenced === 'SI' ? 'info' : 'success'}>
              Referenciado {item.customer.referenced || 'NO'}
            </StatusBadge>
          </div>
          <div className="form-grid two-columns compact-grid">
            <DataField label="Nombre" onChange={(value) => updateCase((draft) => { draft.customer.firstName = value; })} value={item.customer.firstName} />
            <DataField label="Apellido" onChange={(value) => updateCase((draft) => { draft.customer.lastName = value; })} value={item.customer.lastName} />
            <DataField label="Documento" onChange={(value) => updateCase((draft) => { draft.customer.document = value; })} value={item.customer.document} />
            <DataField label="N° siniestro" onChange={(value) => updateCase((draft) => { draft.claimNumber = value; })} value={item.claimNumber || ''} />
            <DataField label="Telefono" onChange={(value) => updateCase((draft) => { draft.customer.phone = value; })} value={item.customer.phone} />
            <DataField label="Localidad" onChange={(value) => updateCase((draft) => { draft.customer.locality = value; })} value={item.customer.locality} />
            <DataField label="Email" onChange={(value) => updateCase((draft) => { draft.customer.email = value; })} value={item.customer.email} />
            <ToggleField label="Referenciado" onChange={(value) => updateCase((draft) => { draft.customer.referenced = value; if (value !== 'SI') draft.customer.referencedName = ''; })} value={item.customer.referenced} />
            {item.customer.referenced === 'SI' ? (
              <DataField label="Nombre referenciado" onChange={(value) => updateCase((draft) => { draft.customer.referencedName = value; })} value={item.customer.referencedName} />
            ) : null}
          </div>
        </article>

        <article className="card inner-card">
          <div className="section-head small-gap">
            <h3>Vehiculo</h3>
            <StatusBadge tone="info">{item.vehicle.plate}</StatusBadge>
          </div>
          <div className="form-grid two-columns compact-grid">
            <DataField label="Marca" onChange={(value) => updateCase((draft) => { draft.vehicle.brand = value; })} value={item.vehicle.brand} />
            <DataField label="Modelo" onChange={(value) => updateCase((draft) => { draft.vehicle.model = value; })} value={item.vehicle.model} />
            <DataField label="Dominio" onChange={(value) => updateCase((draft) => { draft.vehicle.plate = value.toUpperCase(); })} value={item.vehicle.plate} />
            <DataField label="Ano" onChange={(value) => updateCase((draft) => { draft.vehicle.year = value; })} value={item.vehicle.year} />
            <SelectField label="Tipo" onChange={(value) => updateCase((draft) => { draft.vehicle.type = value; })} options={VEHICLE_TYPES} value={item.vehicle.type} />
            <SelectField label="Uso" onChange={(value) => updateCase((draft) => { draft.vehicle.usage = value; })} options={VEHICLE_USES} value={item.vehicle.usage} />
            <SelectField label="Pintura" onChange={(value) => updateCase((draft) => { draft.vehicle.paint = value; })} options={PAINT_TYPES} value={item.vehicle.paint} />
            <DataField label="Color" onChange={(value) => updateCase((draft) => { draft.vehicle.color = value; })} value={item.vehicle.color} />
          </div>
        </article>
      </div>

      <div className="form-grid two-columns">
        <article className="card inner-card">
          <div className="section-head small-gap">
            <h3>Resumen Reparacion</h3>
            <StatusBadge tone={item.computed.partsStatus === 'Recibido' ? 'success' : 'danger'}>{item.computed.partsStatus}</StatusBadge>
          </div>
          <div className="summary-stack">
            <div className="summary-row"><span>Taller</span><strong>{item.budget.workshop}</strong></div>
            <div className="summary-row"><span>Turno</span><strong>{item.repair.turno.date ? `${formatDate(item.repair.turno.date)} · ${item.repair.turno.state}` : 'Sin agendar'}</strong></div>
            <div className="summary-row"><span>Anotaciones turno</span><strong>{item.repair.turno.notes || 'Sin notas de turno'}</strong></div>
            <div className="summary-row"><span>Mano de obra resumen</span><strong>{money(laborSummary)} · comprobante {item.payments.comprobante}</strong></div>
            <div className="summary-row"><span>Salida estimada</span><strong>{item.computed.turnoEstimatedExit ? formatDate(item.computed.turnoEstimatedExit) : 'Pendiente'}</strong></div>
          </div>
        </article>

        <article className="card inner-card">
          <div className="section-head small-gap">
            <h3>Resumen Pagos</h3>
            <StatusBadge tone={item.computed.balance === 0 ? 'success' : 'danger'}>{item.computed.paymentState}</StatusBadge>
          </div>
          <div className="summary-stack">
            <div className="summary-row"><span>Total cotizado</span><strong>{money(item.computed.totalQuoted)}</strong></div>
            <div className="summary-row"><span>Senia</span><strong>{item.payments.hasSena === 'SI' ? money(item.payments.senaAmount) : 'No'}</strong></div>
            <div className="summary-row"><span>Cobrado</span><strong>{money(item.computed.paidAmount)}</strong></div>
            <div className="summary-row"><span>Saldo deudor</span><strong>{money(item.computed.balance)}</strong></div>
            <div className="summary-row"><span>Factura</span><strong>{item.payments.invoice === 'SI' ? `${item.payments.businessName} · ${item.payments.invoiceNumber}` : 'No'}</strong></div>
          </div>
        </article>
      </div>
    </div>
  );
}

function PresupuestoTab({ item, updateCase, flash }) {
  const [previewMedia, setPreviewMedia] = useState(null);
  const [failedMediaIds, setFailedMediaIds] = useState([]);
  const [brokenPreviewIds, setBrokenPreviewIds] = useState([]);

  const updateBudget = (mutator, { syncParts = false } = {}) => {
    updateCase((draft) => {
      mutator(draft);
      if (syncParts) {
        syncRepairPartsWithBudget(draft);
      }
    });
  };

  const updateBudgetLine = (lineId, mutator, { syncParts = false } = {}) => {
    updateBudget((draft) => {
      const target = draft.budget.lines.find((entry) => entry.id === lineId);
      if (!target) return;
      mutator(target, draft);
    }, { syncParts });
  };

  const addLine = () => {
    const current = item.budget.lines.at(-1);

    if (current && !lineIsComplete(current)) {
      flash('No se permite nueva linea si la actual no tiene pieza afectada, tarea a ejecutar y nivel de dano.');
      return;
    }

    updateBudget((draft) => {
      draft.budget.lines.push(createBudgetLine());
    }, { syncParts: true });
  };

  const removeLine = (lineId) => {
    if (item.budget.lines.length === 1) {
      flash('Necesitas al menos una linea de presupuesto.');
      return;
    }

    updateBudget((draft) => {
      draft.budget.lines = draft.budget.lines.filter((line) => line.id !== lineId);
    }, { syncParts: true });
  };

  const generateBudget = () => {
    if (!item.computed.canGenerateBudget) {
      flash('No se puede generar presupuesto sin informe completo y marcado como cerrado.');
      return;
    }

    updateBudget((draft) => {
      draft.budget.generated = true;
    }, { syncParts: true });
  };

  const changeReportStatus = (value) => {
    if (value === 'Informe cerrado') {
      if (!item.budget.workshop) {
        flash('Definí el taller antes de cerrar el informe.');
        return;
      }
      if (!item.computed.hasVehicleData) {
        const missing = item.computed.vehicleMissingFields.join(', ');
        flash(`No se puede cerrar el informe: falta ${missing || 'completar la ficha tecnica del vehiculo'}.`);
        return;
      }
      if (item.computed.pendingReplacementDecision) {
        flash(`Defini la decision interna de repuesto para ${item.computed.pendingReplacementDecision.piece || 'las lineas con REEMPLAZAR'} antes de cerrar.`);
        return;
      }
    }

    updateBudget((draft) => {
      draft.budget.reportStatus = value;
      if (value !== 'Informe cerrado') {
        draft.budget.generated = false;
      }
    });
  };

  const highlightLineErrors = item.budget.reportStatus === 'Informe cerrado';
  const workshopInfo = getWorkshopInfo(item.budget.workshop);
  const mediaItems = item.vehicleMedia ?? [];
  const vehicleSummary = [
    { label: 'Dominio', value: item.vehicle.plate || 'Pendiente' },
    { label: 'Marca / modelo', value: `${item.vehicle.brand || 'Pendiente'} ${item.vehicle.model || ''}`.trim() },
    { label: 'Ano', value: item.vehicle.year || 'Pendiente' },
    { label: 'Tipo', value: item.vehicle.type || 'Pendiente' },
    { label: 'Uso', value: item.vehicle.usage || 'Pendiente' },
    { label: 'Pintura', value: item.vehicle.paint || 'Pendiente' },
    { label: 'Color', value: item.vehicle.color || 'Pendiente' },
  ];
  const customerDisplayName = `${item.customer.firstName || ''} ${item.customer.lastName || ''}`.trim() || 'Pendiente';
  const budgetStatusTone = item.computed.budgetReady ? 'success' : item.computed.canGenerateBudget ? 'info' : 'danger';
  const budgetStatusLabel = item.computed.budgetReady
    ? 'Presupuesto emitido y listo para Gestion reparacion'
    : item.computed.canGenerateBudget
      ? 'Informe cerrado. Falta generar el presupuesto final'
      : 'Presupuesto en rojo';
  const budgetHelperCopy = item.computed.budgetReady
    ? 'Los reemplazos ya quedaron sincronizados en Repuestos.'
    : item.computed.canGenerateBudget
      ? 'Al generar, los reemplazos se sincronizan en Repuestos.'
      : 'Completá taller, vehiculo, lineas, decision de reemplazo y mano de obra.';

  const markMediaThumbFailed = (mediaId) => {
    setFailedMediaIds((current) => (current.includes(mediaId) ? current : [...current, mediaId]));
  };

  const markPreviewFailed = (mediaId) => {
    setBrokenPreviewIds((current) => (current.includes(mediaId) ? current : [...current, mediaId]));
  };

  const currentPreviewBroken = previewMedia ? brokenPreviewIds.includes(previewMedia.id) : false;

  return (
    <div className="tab-layout budget-layout">
      <div className="budget-main-grid">
        <article className="card inner-card workshop-shell">
          <div className="section-head">
            <div>
              <p className="eyebrow">Presupuesto Particular</p>
              <h3>{item.budget.workshop || 'Seleccioná el taller'}</h3>
            </div>
            <div className="form-grid three-columns compact-grid inline-fields">
              <SelectField
                invalid={!item.budget.workshop && item.budget.reportStatus === 'Informe cerrado'}
                label="Taller"
                onChange={(value) => updateBudget((draft) => { draft.budget.workshop = value; })}
                options={WORKSHOP_OPTIONS}
                placeholder="Seleccioná un taller"
                required
                value={item.budget.workshop}
              />
              <SelectField label="Autorizó" onChange={(value) => updateBudget((draft) => { draft.budget.authorizer = value; })} options={AUTHORIZER_OPTIONS} value={item.budget.authorizer} />
              <SelectField label="Informe" onChange={changeReportStatus} options={REPORT_STATUS_OPTIONS} value={item.budget.reportStatus} />
            </div>
          </div>

          <div className="workshop-banner">
            <div className="workshop-identity">
              <div className="workshop-logo-shell" aria-hidden="true">
                {workshopInfo?.logo ? <img alt="" src={workshopInfo.logo} /> : <span>DT</span>}
              </div>
              <div className="workshop-copy">
                <span className="workshop-kicker">Cabecera por taller</span>
                <strong>{workshopInfo?.legalName || 'Datos comerciales pendientes'}</strong>
                <small>{workshopInfo ? `${workshopInfo.taxId} · ${workshopInfo.taxCondition}` : 'Agregá el taller para ver CUIT y condición impositiva.'}</small>
                <small>{workshopInfo ? `${workshopInfo.address} · ${workshopInfo.phone}` : ''}</small>
                <small>{workshopInfo?.email}</small>
              </div>
            </div>
            <div className="budget-workshop-status">
              <StatusBadge tone={item.computed.reportClosed ? 'success' : 'danger'}>
                {item.budget.reportStatus}
              </StatusBadge>
              <StatusBadge tone={budgetStatusTone}>{budgetStatusLabel}</StatusBadge>
            </div>
          </div>

          <div className="vehicle-summary-card">
            <div className="vehicle-summary-head">
              <div>
                <span>Vehiculo desde Ficha Tecnica</span>
                <strong>{item.vehicle.brand || 'Pendiente'} {item.vehicle.model || ''}</strong>
                <small>Se espejan los datos del vehiculo; las observaciones quedan fuera de esta cabecera.</small>
              </div>
              <div className="vehicle-summary-owner">
                <span>Cliente</span>
                <strong>{customerDisplayName}</strong>
                <small>{item.customer.phone || 'Telefono pendiente'}</small>
              </div>
            </div>
            <div className="vehicle-meta-grid">
              {vehicleSummary.map((entry) => (
                <div key={entry.label}>
                  <span>{entry.label}</span>
                  <strong>{entry.value}</strong>
                </div>
              ))}
            </div>
            {!item.computed.hasVehicleData ? (
              <div className="inline-alert danger-banner">
                No podés cerrar el informe hasta completar en Ficha Tecnica: {item.computed.vehicleMissingFields.join(', ')}.
              </div>
            ) : null}
          </div>

          <div className="media-mock-grid budget-header-grid">
            <article>
              <span>Informe</span>
              <strong>{item.budget.reportStatus}</strong>
              <small>Datos espejo del Excel Particular</small>
            </article>
            <article>
              <span>Repuestos cotizados</span>
              <strong>{item.budget.partsProvider || 'Sin proveedor'}</strong>
              <small>{item.budget.partsQuotedDate ? `Fecha ${formatDate(item.budget.partsQuotedDate)}` : 'Falta fecha de cotización'}</small>
            </article>
            <article>
              <span>Días estimados</span>
              <strong>{item.budget.estimatedWorkDays || 'Pendiente'}</strong>
              <small>Mínimo cierre MO {item.budget.minimumLaborClose ? money(item.budget.minimumLaborClose) : 'sin dato'}</small>
            </article>
          </div>
        </article>

        <article className="card inner-card media-panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">Fotos y videos</p>
              <h3>Evidencia de daños</h3>
            </div>
            <StatusBadge tone={mediaItems.length ? 'info' : 'danger'}>
              {mediaItems.length ? `${mediaItems.length} adjunto(s)` : 'Sin archivos'}
            </StatusBadge>
          </div>

          {mediaItems.length ? (
            <div className="media-gallery">
              {mediaItems.map((media) => (
                <button
                  aria-label={`Abrir ${media.type === 'video' ? 'video' : 'foto'} ${media.label}`}
                  className="media-card"
                  key={media.id}
                  onClick={() => setPreviewMedia(media)}
                  type="button"
                >
                  {media.thumbnail && !failedMediaIds.includes(media.id) ? (
                    <img
                      alt=""
                      className="media-card-image"
                      onError={() => markMediaThumbFailed(media.id)}
                      src={media.thumbnail}
                    />
                  ) : (
                    <div className="media-card-fallback" aria-hidden="true">
                      <strong>{media.type === 'video' ? 'VIDEO' : 'ARCHIVO'}</strong>
                      <small>Preview no disponible</small>
                    </div>
                  )}
                  <span className="media-card-scrim" aria-hidden="true" />
                  <span>{media.label}</span>
                  <small>{media.description || (media.type === 'video' ? 'Video' : 'Foto')}</small>
                </button>
              ))}
            </div>
          ) : (
            <div className="empty-media" role="status">
              Cargá las fotos en Ficha Técnica &gt; Ingreso para verlas acá mientras presupuestás.
            </div>
          )}
        </article>
      </div>

      <article className="card inner-card">
        <div className="section-head">
          <div>
            <p className="eyebrow">Lineas del informe</p>
            <h3>Columnas del Excel</h3>
          </div>
          <button className="secondary-button" onClick={addLine} type="button">Agregar linea</button>
        </div>

        <div className="budget-lines">
          {item.budget.lines.map((line, index) => {
            const lineIssues = getBudgetLineIssues(line);
            const isReplacementLine = lineNeedsReplacementDecision(line);

            return (
            <div className="budget-line budget-line-extended" key={line.id}>
              <div className="budget-line-header">
                <strong>Linea {index + 1}</strong>
                <small>{line.action || 'Definí la tarea para derivar la accion'}</small>
              </div>
              <DataField label="Pieza afectada" onChange={(value) => updateBudgetLine(line.id, (target) => {
                target.piece = value;
              }, { syncParts: true })} required value={line.piece} invalid={!line.piece && highlightLineErrors} />
              <SelectField
                label="Tarea a ejecutar"
                onChange={(value) => updateBudgetLine(line.id, (target) => {
                  target.task = value;
                  target.action = getBudgetAction(value);
                  if (!lineNeedsReplacementDecision({ task: value })) {
                    target.replacementDecision = '';
                    target.partPrice = '';
                  }
                }, { syncParts: true })}
                options={BUDGET_TASK_OPTIONS}
                placeholder="Seleccioná una tarea"
                required
                value={line.task}
                invalid={!line.task && highlightLineErrors}
              />
              <SelectField
                label="Nivel de daño"
                onChange={(value) => updateBudgetLine(line.id, (target) => {
                  target.damageLevel = value;
                })}
                options={BUDGET_DAMAGE_OPTIONS}
                placeholder="Seleccioná el daño"
                required
                value={line.damageLevel}
                invalid={!line.damageLevel && highlightLineErrors}
              />
              <SelectField
                label="Decision interna"
                onChange={(value) => updateBudgetLine(line.id, (target) => {
                  target.replacementDecision = value;
                }, { syncParts: true })}
                options={BUDGET_PART_DECISION_OPTIONS}
                placeholder={isReplacementLine ? 'Definí si reemplaza o repara' : 'No aplica'}
                value={line.replacementDecision}
                invalid={isReplacementLine && !line.replacementDecision && highlightLineErrors}
              />
              <DataField
                label="$ repuesto"
                inputMode="numeric"
                onChange={(value) => updateBudgetLine(line.id, (target) => {
                  target.partPrice = value;
                }, { syncParts: true })}
                placeholder={isReplacementLine ? 'Opcional si reemplaza' : 'Sin repuesto'}
                readOnly={!isReplacementLine}
                value={line.partPrice}
              />
              {highlightLineErrors && lineIssues.length ? (
                <div className="inline-alert danger-banner budget-line-alert">
                  Falta completar: {lineIssues.join(', ')}.
                </div>
              ) : null}
              <div className="budget-line-footer">
                <div className="budget-line-meta">
                  <StatusBadge tone={lineIsComplete(line) ? 'success' : 'danger'}>
                    {lineIsComplete(line) ? 'Linea completa' : 'Falta completar'}
                  </StatusBadge>
                  {isReplacementLine ? (
                    <StatusBadge tone={line.replacementDecision ? 'info' : 'danger'}>
                      {line.replacementDecision || 'Sin decision'}
                    </StatusBadge>
                  ) : null}
                  <small>{line.action || 'Definí la tarea para derivar acción'}</small>
                </div>
                <button className="ghost-button" onClick={() => removeLine(line.id)} type="button">Eliminar linea</button>
              </div>
            </div>
            );
          })}
        </div>
      </article>

      <article className="card inner-card">
        <div className="section-head">
          <div>
            <p className="eyebrow">Servicios adicionales</p>
            <h3>Checklist del Excel con desplegables</h3>
          </div>
          <StatusBadge tone="info">SI / NO / A/V</StatusBadge>
        </div>

        <div className="budget-services-grid">
          {item.budget.services.map((service) => (
            <div className="nested-card budget-service-card" key={service.id}>
              <div className="section-head small-gap">
                <strong>{service.label}</strong>
                <StatusBadge tone={service.status === 'SI' ? 'success' : service.status === 'A/V' ? 'info' : 'danger'}>
                  {service.status || 'NO'}
                </StatusBadge>
              </div>
              <SelectField
                label="Aplica"
                onChange={(value) => updateBudget((draft) => {
                  const target = draft.budget.services.find((entry) => entry.id === service.id);
                  target.status = value;
                  if (value === 'NO') {
                    target.detail = '';
                  }
                })}
                options={YES_NO_AV_OPTIONS}
                value={service.status}
              />
              <DataField
                label="Detalle"
                onChange={(value) => updateBudget((draft) => {
                  const target = draft.budget.services.find((entry) => entry.id === service.id);
                  target.detail = value;
                })}
                placeholder="Detalle interno"
                value={service.detail}
              />
            </div>
          ))}
        </div>
      </article>

      <article className="card inner-card">
        <div className="section-head">
          <div>
            <p className="eyebrow">Cierre económico</p>
            <h3>Totales y condiciones para emitir</h3>
          </div>
        </div>

        <div className="form-grid three-columns compact-grid">
          <DataField label="Fecha cotización repuestos" onChange={(value) => updateBudget((draft) => { draft.budget.partsQuotedDate = value; })} type="date" value={item.budget.partsQuotedDate} />
          <DataField label="Proveedor repuestos" onChange={(value) => updateBudget((draft) => { draft.budget.partsProvider = value; })} value={item.budget.partsProvider} />
          <DataField label="Dias de trabajo estimados" onChange={(value) => updateBudget((draft) => { draft.budget.estimatedWorkDays = value; })} type="number" value={item.budget.estimatedWorkDays} />
          <DataField label="Monto minimo cierre MO" inputMode="numeric" onChange={(value) => updateBudget((draft) => { draft.budget.minimumLaborClose = value; })} value={item.budget.minimumLaborClose} />
          <DataField label="Mano de obra s/IVA" inputMode="numeric" onChange={(value) => updateBudget((draft) => { draft.budget.laborWithoutVat = value; })} value={item.budget.laborWithoutVat} />
          <DataField label="IVA 21% MO" onChange={() => {}} readOnly value={item.computed.laborVat} />
        </div>

        <label className="field">
          <span>Observaciones internas</span>
          <textarea onChange={(event) => updateBudget((draft) => { draft.budget.observations = event.target.value; })} value={item.budget.observations} />
        </label>

        <div className="budget-totals-stack">
          <div className="budget-subtotals-grid">
            <article className="summary-chip budget-total-card">
              <span>Repuestos</span>
              <strong>{money(item.computed.partsTotal)}</strong>
            </article>
            <article className="summary-chip budget-total-card">
              <span>MO s/IVA</span>
              <strong>{money(item.computed.laborWithoutVat)}</strong>
            </article>
            <article className="summary-chip budget-total-card">
              <span>IVA 21%</span>
              <strong>{money(item.computed.laborVat)}</strong>
            </article>
            <article className="summary-chip budget-total-card">
              <span>MO c/IVA</span>
              <strong>{money(item.computed.laborWithVat)}</strong>
            </article>
          </div>

          <article className="summary-chip budget-total-card budget-total-card-emphasis budget-total-summary">
            <span>Total presupuesto</span>
            <strong>{money(item.computed.budgetTotalWithVat)}</strong>
          </article>
        </div>

        <div className="budget-actions-row">
          <button className="primary-button" disabled={!item.computed.canGenerateBudget} onClick={generateBudget} type="button">Generar presupuesto</button>
        </div>

        <div className="budget-ready-panel budget-ready-panel-compact">
          <StatusBadge tone={budgetStatusTone}>{budgetStatusLabel}</StatusBadge>
          <small>{budgetHelperCopy}</small>
        </div>
      </article>

      {previewMedia ? (
        <div className="media-overlay" onClick={() => setPreviewMedia(null)} role="presentation">
          <div aria-label={`Vista ampliada de ${previewMedia.label}`} aria-modal="true" className="media-modal" onClick={(event) => event.stopPropagation()} role="dialog">
            <div className="media-modal-head">
              <div>
                <strong>{previewMedia.label}</strong>
                <p>{previewMedia.description || (previewMedia.type === 'video' ? 'Video adjunto desde Ficha Tecnica.' : 'Foto adjunta desde Ficha Tecnica.')}</p>
              </div>
              <button className="ghost-button" onClick={() => setPreviewMedia(null)} type="button">Cerrar</button>
            </div>

            {previewMedia.type === 'video' ? (
              currentPreviewBroken ? (
                <div className="empty-media" role="status">
                  El archivo no se pudo previsualizar. Abrilo en una pestaña nueva para revisar el adjunto original.
                </div>
              ) : (
                <video controls onError={() => markPreviewFailed(previewMedia.id)} src={previewMedia.url} />
              )
            ) : (
              currentPreviewBroken ? (
                <div className="empty-media" role="status">
                  La imagen no cargó en la previsualización. Usá "Abrir archivo" para validarla igual.
                </div>
              ) : (
                <img alt={previewMedia.label} onError={() => markPreviewFailed(previewMedia.id)} src={previewMedia.url} />
              )
            )}

            <div className="media-preview-actions">
              <a className="secondary-button button-link" href={previewMedia.url} rel="noreferrer" target="_blank">Abrir archivo</a>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function GestionReparacionTab({ item, updateCase, activeRepairTab, onChangeRepairTab, flash }) {
  const syncBudgetParts = (resetRemoved = false) => {
    updateCase((draft) => {
      if (resetRemoved) {
        draft.repair.removedBudgetLineIds = [];
      }
      syncRepairPartsWithBudget(draft);
    });
  };

  const removeRepairPart = (partId) => {
    updateCase((draft) => {
      const target = draft.repair.parts.find((entry) => entry.id === partId);
      if (target?.source === 'budget' && target.sourceLineId) {
        draft.repair.removedBudgetLineIds = [...new Set([...(draft.repair.removedBudgetLineIds || []), target.sourceLineId])];
      }
      draft.repair.parts = draft.repair.parts.filter((entry) => entry.id !== partId);
    });
  };

  const assignTurn = () => {
    if (!item.computed.budgetReady) {
      flash('Gestion reparacion sigue bloqueada hasta que Presupuesto quede completo y generado.');
      return;
    }

    if (!item.computed.turnoReady) {
      flash('No se puede agendar turno si faltan fecha, dias estimados, salida estimada y estado.');
      return;
    }

    flash('Turno demo agendado. La salida estimada excluye fines de semana.');
  };

  const addRepairPart = () => {
    updateCase((draft) => {
      draft.repair.parts.push(createRepairPart());
    });
  };

  const addIngresoItem = () => {
    updateCase((draft) => {
      if (!draft.repair.ingreso.items) {
        draft.repair.ingreso.items = [];
      }
      draft.repair.ingreso.items.push(createIngresoItem());
    });
  };

  const repairTabs = [
    { id: 'repuestos', label: 'Repuestos' },
    { id: 'turno', label: 'Turno' },
    { id: 'ingreso', label: 'Ingreso' },
    { id: 'egreso', label: 'Egreso' },
  ];
  const autoPartCount = item.repair.parts.filter((part) => part.source === 'budget').length;
  const manualPartCount = item.repair.parts.filter((part) => part.source !== 'budget').length;
  const overriddenPartCount = item.repair.parts.filter((part) => part.source === 'budget' && part.amount !== part.budgetAmount).length;
  const removedBudgetLineIds = item.repair.removedBudgetLineIds || [];
  const expectedBudgetPartsSignature = item.computed.budgetParts
    .filter((part) => !removedBudgetLineIds.includes(part.lineId))
    .map((part) => `${part.lineId}:${part.name}:${part.amount}:${part.replacementDecision || ''}`)
    .join('|');
  const currentBudgetPartsSignature = item.repair.parts
    .filter((part) => part.source === 'budget')
    .map((part) => `${part.sourceLineId}:${part.name}:${part.budgetAmount || part.amount}`)
    .join('|');

  useEffect(() => {
    if (activeRepairTab !== 'repuestos') {
      return;
    }

    if (expectedBudgetPartsSignature !== currentBudgetPartsSignature) {
      syncBudgetParts();
    }
  }, [activeRepairTab, currentBudgetPartsSignature, expectedBudgetPartsSignature]);

  return (
    <div className="tab-layout">
      {!item.computed.budgetReady ? (
        <div className="alert-banner danger-banner">Presupuesto en rojo: completá y generá el informe para habilitar acciones operativas.</div>
      ) : null}

      <div className="subtabs-row">
        {repairTabs.map((tab) => (
          <button className={`subtab-button ${activeRepairTab === tab.id ? 'is-active' : ''}`} key={tab.id} onClick={() => onChangeRepairTab(tab.id)} type="button">
            {tab.label}
          </button>
        ))}
      </div>

      {activeRepairTab === 'repuestos' ? (
        <div className="repuestos-stack">
          <article className="card inner-card parts-forecast-card">
            <div className="section-head">
              <div>
                <p className="eyebrow">Repuestos presupuestados</p>
                <h3>Traídos desde REEMPLAZAR</h3>
              </div>
              <StatusBadge tone={item.computed.budgetParts.length ? 'info' : 'danger'}>
                {item.computed.budgetParts.length ? `${item.computed.budgetParts.length} piezas` : 'Sin líneas'}
              </StatusBadge>
            </div>

            <div className="inline-alert info-banner">
              Esta sub-solapa replica automáticamente las lineas con REEMPLAZAR. Podés sacar items acá sin tocar el origen del presupuesto.
            </div>

            {item.computed.budgetParts.length ? (
              <div className="parts-forecast-grid">
                {item.computed.budgetParts.map((part) => (
                  <div className="nested-card" key={part.lineId}>
                    <div className="section-head small-gap">
                      <div>
                        <strong>{part.name}</strong>
                        <small>{part.task}</small>
                      </div>
                      <span className="damage-pill">{part.damageLevel || 'Sin nivel'}</span>
                    </div>
                    <div className="summary-row">
                      <span>Monto referencial</span>
                      <strong>{money(part.amount)}</strong>
                    </div>
                    <div className="part-source-row">
                      <small>{part.replacementDecision || 'Sin decision interna'}</small>
                      {removedBudgetLineIds.includes(part.lineId) ? <StatusBadge tone="danger">Quitado en Repuestos</StatusBadge> : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-media" role="status">
                Marca las líneas con REEMPLAZAR y completá la pieza para poblar este listado.
              </div>
            )}

            <div className="parts-total-row">
              <span>Total presupuestado</span>
              <strong>{money(item.computed.partsTotal)}</strong>
            </div>
          </article>

          <article className="card inner-card">
            <div className="section-head">
              <div>
                <p className="eyebrow">Gestión operativa</p>
                <h3>Pedidos y recepciones</h3>
              </div>
              <div className="tag-row">
                <StatusBadge tone={item.repair.parts.length ? 'info' : 'danger'}>{money(item.computed.repairPartsTotal)}</StatusBadge>
                <StatusBadge tone={autoPartCount ? 'success' : 'danger'}>{autoPartCount} automático(s)</StatusBadge>
                <StatusBadge tone={manualPartCount ? 'info' : 'danger'}>{manualPartCount} manual(es)</StatusBadge>
                <StatusBadge tone={overriddenPartCount ? 'info' : 'success'}>{overriddenPartCount} editado(s)</StatusBadge>
                <button className="secondary-button" onClick={() => syncBudgetParts(true)} type="button">Traer reemplazos</button>
                <button className="secondary-button" onClick={addRepairPart} type="button">Agregar repuesto</button>
              </div>
            </div>

            <div className="parts-total-grid">
              <article className="summary-chip">
                <span>Total presupuestado</span>
                <strong>{money(item.computed.partsTotal)}</strong>
              </article>
              <article className="summary-chip">
                <span>Total gestionado</span>
                <strong>{money(item.computed.repairPartsTotal)}</strong>
              </article>
              <article className="summary-chip">
                <span>Diferencia</span>
                <strong>{money(item.computed.repairPartsTotal - item.computed.partsTotal)}</strong>
              </article>
            </div>

            <div className="budget-lines">
              {item.repair.parts.length ? (
                item.repair.parts.map((part) => (
                  <div className="budget-line repair-part-line" key={part.id}>
                    <div className="budget-line-header">
                      <strong>{part.name || 'Nuevo repuesto'}</strong>
                      <small>{part.source === 'budget' ? 'Arrastrado desde Presupuesto' : 'Carga independiente en Repuestos'}</small>
                    </div>
                    <DataField label="Repuesto" onChange={(value) => updateCase((draft) => {
                      const target = draft.repair.parts.find((entry) => entry.id === part.id);
                      target.name = value;
                    })} value={part.name} />
                    <DataField label="Proveedor" onChange={(value) => updateCase((draft) => {
                      const target = draft.repair.parts.find((entry) => entry.id === part.id);
                      target.provider = value;
                    })} value={part.provider} />
                    <DataField label="Importe" onChange={(value) => updateCase((draft) => {
                      const target = draft.repair.parts.find((entry) => entry.id === part.id);
                      target.amount = value;
                    })} value={part.amount} />
                    <SelectField label="Estado" onChange={(value) => updateCase((draft) => {
                      const target = draft.repair.parts.find((entry) => entry.id === part.id);
                      target.state = value;
                    })} options={REPAIR_PART_STATE_OPTIONS} value={part.state} />
                    <SelectField label="Compra" onChange={(value) => updateCase((draft) => {
                      const target = draft.repair.parts.find((entry) => entry.id === part.id);
                      target.purchaseBy = value;
                    })} options={REPAIR_PART_BUYER_OPTIONS} value={part.purchaseBy} />
                    <SelectField label="Pago" onChange={(value) => updateCase((draft) => {
                      const target = draft.repair.parts.find((entry) => entry.id === part.id);
                      target.paymentStatus = value;
                    })} options={REPAIR_PART_PAYMENT_OPTIONS} value={part.paymentStatus} />
                    <div className="budget-line-footer">
                      <div className="budget-line-meta repair-line-meta">
                        <StatusBadge tone={part.source === 'budget' ? 'info' : 'success'}>
                          {part.source === 'budget' ? 'Desde presupuesto' : 'Carga manual'}
                        </StatusBadge>
                        {part.budgetAmount ? <small>Monto ref: {money(part.budgetAmount)}</small> : null}
                        {part.source === 'budget' && part.amount !== part.budgetAmount ? <small>Importe editado en Repuestos</small> : null}
                      </div>
                      <button className="ghost-button" onClick={() => removeRepairPart(part.id)} type="button">Eliminar</button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-media" role="status">Todavía no cargaste repuestos gestionados.</div>
              )}
            </div>

            <div className="parts-total-row">
              <span>Total gestionado</span>
              <strong>{money(item.computed.repairPartsTotal)}</strong>
            </div>
          </article>
        </div>
      ) : null}

      {activeRepairTab === 'turno' ? (
        <article className="card inner-card">
          <div className="section-head">
            <div>
              <p className="eyebrow">Subsolapa Turno</p>
              <h3>Agenda demo con salida estimada automatica</h3>
            </div>
            <button className="primary-button" onClick={assignTurn} type="button">Agendar turno</button>
          </div>

          <div className="form-grid four-columns compact-grid">
            <DataField label="Fecha" onChange={(value) => updateCase((draft) => { draft.repair.turno.date = value; })} type="date" value={item.repair.turno.date} />
            <DataField label="Dias estimados" onChange={(value) => updateCase((draft) => { draft.repair.turno.estimatedDays = value; })} type="number" value={item.repair.turno.estimatedDays} />
            <DataField label="Salida estimada" onChange={() => {}} type="date" value={item.computed.turnoEstimatedExit} />
            <SelectField label="Estado" onChange={(value) => updateCase((draft) => { draft.repair.turno.state = value; })} options={TURNO_STATE_OPTIONS} value={item.repair.turno.state} />
          </div>
          <label className="field">
            <span>Anotaciones de turno</span>
            <textarea onChange={(event) => updateCase((draft) => { draft.repair.turno.notes = event.target.value; })} value={item.repair.turno.notes} />
          </label>
        </article>
      ) : null}

      {activeRepairTab === 'ingreso' ? (
        <article className="card inner-card">
          <div className="section-head">
            <div>
              <p className="eyebrow">Subsolapa Ingreso</p>
              <h3>Fecha real + ítems del Excel</h3>
            </div>
            <StatusBadge tone={item.repair.ingreso.realDate ? 'success' : 'danger'}>{item.repair.ingreso.realDate ? 'Ingreso registrado' : 'Pendiente'}</StatusBadge>
          </div>

          <div className="form-grid three-columns compact-grid">
            <DataField label="Ingreso real" onChange={(value) => updateCase((draft) => { draft.repair.ingreso.realDate = value; })} type="date" value={item.repair.ingreso.realDate} />
            <DataField label="Salida estimada" onChange={() => {}} type="date" value={item.computed.turnoEstimatedExit} />
            <ToggleField label="Observacion en ingreso" onChange={(value) => updateCase((draft) => {
              draft.repair.ingreso.hasObservation = value;
              if (value !== 'SI') {
                draft.repair.ingreso.observation = '';
                draft.repair.ingreso.items = [];
              }
            })} value={item.repair.ingreso.hasObservation} />
          </div>

          {item.repair.ingreso.hasObservation === 'SI' ? (
            <>
              <label className="field">
                <span>Resumen general</span>
                <textarea onChange={(event) => updateCase((draft) => { draft.repair.ingreso.observation = event.target.value; })} value={item.repair.ingreso.observation} />
              </label>

              <div className="section-head small-gap">
                <h4>Ítems observados</h4>
                <button className="secondary-button" onClick={addIngresoItem} type="button">Agregar ítem</button>
              </div>

              <div className="budget-lines">
                {item.computed.ingresoItems.map((entry) => (
                  <div className="budget-line" key={entry.id}>
                    <SelectField label="Tipo" onChange={(value) => updateCase((draft) => {
                      const target = draft.repair.ingreso.items.find((itemEntry) => itemEntry.id === entry.id);
                      target.type = value;
                    })} options={INGRESO_TYPES} value={entry.type} />
                    <DataField label="Daño / observaciones" onChange={(value) => updateCase((draft) => {
                      const target = draft.repair.ingreso.items.find((itemEntry) => itemEntry.id === entry.id);
                      target.detail = value;
                    })} value={entry.detail} />
                    <DataField label="Fotos / videos" onChange={(value) => updateCase((draft) => {
                      const target = draft.repair.ingreso.items.find((itemEntry) => itemEntry.id === entry.id);
                      target.media = value;
                    })} value={entry.media} />
                    <button className="ghost-button" onClick={() => updateCase((draft) => {
                      draft.repair.ingreso.items = draft.repair.ingreso.items.filter((itemEntry) => itemEntry.id !== entry.id);
                    })} type="button">Eliminar</button>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </article>
      ) : null}

      {activeRepairTab === 'egreso' ? (
        <article className="card inner-card">
          <div className="section-head">
            <div>
              <p className="eyebrow">Subsolapa Egreso</p>
              <h3>Cierre, reingreso y fotos reparado</h3>
            </div>
            <StatusBadge tone={item.computed.repairResolved ? 'success' : 'danger'}>{item.computed.repairStatus}</StatusBadge>
          </div>

          <div className="form-grid four-columns compact-grid">
            <DataField label="Fecha egreso" onChange={(value) => updateCase((draft) => { draft.repair.egreso.date = value; })} type="date" value={item.repair.egreso.date} />
            <ToggleField label="Debe reingresar" onChange={(value) => updateCase((draft) => { draft.repair.egreso.shouldReenter = value; })} value={item.repair.egreso.shouldReenter} />
            <button className={`toggle-button ${item.repair.egreso.definitiveExit ? 'is-on' : ''}`} onClick={() => updateCase((draft) => { draft.repair.egreso.definitiveExit = !draft.repair.egreso.definitiveExit; })} type="button">
              Egreso definitivo
            </button>
            <button className={`toggle-button ${item.repair.egreso.repairedPhotos ? 'is-on' : ''}`} onClick={() => updateCase((draft) => { draft.repair.egreso.repairedPhotos = !draft.repair.egreso.repairedPhotos; })} type="button">
              Fotos vehiculo reparado
            </button>
          </div>

          <label className="field">
            <span>Anotaciones de egreso</span>
            <textarea onChange={(event) => updateCase((draft) => { draft.repair.egreso.notes = event.target.value; })} value={item.repair.egreso.notes} />
          </label>

          {item.repair.egreso.shouldReenter === 'SI' ? (
            <div className="nested-card">
              <h4>Turno reingreso</h4>
              <div className="form-grid three-columns compact-grid">
                <DataField label="Fecha reingreso" onChange={(value) => updateCase((draft) => { draft.repair.egreso.reentryDate = value; })} type="date" value={item.repair.egreso.reentryDate} />
                <DataField label="Dias estimados" onChange={(value) => updateCase((draft) => { draft.repair.egreso.reentryEstimatedDays = value; })} type="number" value={item.repair.egreso.reentryEstimatedDays} />
                <DataField label="Salida reingreso" onChange={() => {}} type="date" value={item.computed.reentryEstimatedExit} />
                <SelectField label="Estado reingreso" onChange={(value) => updateCase((draft) => { draft.repair.egreso.reentryState = value; })} options={TURNO_STATE_OPTIONS} value={item.repair.egreso.reentryState} />
              </div>
              <label className="field">
                <span>Notas reingreso</span>
                <textarea onChange={(event) => updateCase((draft) => { draft.repair.egreso.reentryNotes = event.target.value; })} value={item.repair.egreso.reentryNotes} />
              </label>
            </div>
          ) : null}
        </article>
      ) : null}
    </div>
  );
}

function PagosTab({ item, updateCase }) {
  const addSettlement = () => {
    updateCase((draft) => {
      draft.payments.settlements.push(createSettlement());
    });
  };

  const paymentEvents = collectPaymentEvents([item]);

  return (
    <div className="tab-layout">
      <article className="card inner-card receipt-shell">
        <div className="section-head">
          <div>
            <p className="eyebrow">Pagos</p>
            <h3>Comprobante, saldo y lectura contable</h3>
          </div>
          <StatusBadge tone={item.computed.balance === 0 ? 'success' : 'danger'}>{money(item.computed.balance)}</StatusBadge>
        </div>

        <div className="receipt-grid">
          <div className="summary-stack">
            <div className="summary-row"><span>Cliente</span><strong>{item.customer.lastName}, {item.customer.firstName}</strong></div>
            <div className="summary-row"><span>Vehiculo</span><strong>{item.vehicle.brand} {item.vehicle.model} - {item.vehicle.plate}</strong></div>
            <div className="summary-row"><span>Repuestos</span><strong>{money(item.computed.partsTotal)}</strong></div>
            <div className="summary-row"><span>Mano de obra</span><strong>{money(item.payments.comprobante === 'A' ? item.computed.laborWithVat : item.computed.laborWithoutVat)}</strong></div>
            <div className="summary-row"><span>Total cotizado</span><strong>{money(item.computed.totalQuoted)}</strong></div>
            <div className="summary-row"><span>Retenciones cargadas</span><strong>{money(item.computed.totalRetentions)}</strong></div>
          </div>

          <div className="form-grid two-columns compact-grid">
            <SelectField label="Comprobante" onChange={(value) => updateCase((draft) => { draft.payments.comprobante = value; })} options={COMPROBANTES} value={item.payments.comprobante} />
            <ToggleField label="Factura" onChange={(value) => updateCase((draft) => { draft.payments.invoice = value; if (value !== 'SI') { draft.payments.businessName = ''; draft.payments.invoiceNumber = ''; } })} value={item.payments.invoice} />
            <ToggleField label="Senia" onChange={(value) => updateCase((draft) => { draft.payments.hasSena = value; if (value !== 'SI') { draft.payments.senaAmount = ''; draft.payments.senaDate = ''; draft.payments.senaModeDetail = ''; } })} value={item.payments.hasSena} />
          </div>
        </div>

        {item.payments.hasSena === 'SI' ? (
          <div className="form-grid four-columns compact-grid">
            <DataField label="Monto senia" onChange={(value) => updateCase((draft) => { draft.payments.senaAmount = value; })} value={item.payments.senaAmount} />
            <DataField label="Fecha senia" onChange={(value) => updateCase((draft) => { draft.payments.senaDate = value; })} type="date" value={item.payments.senaDate} />
            <SelectField label="Modo" onChange={(value) => updateCase((draft) => { draft.payments.senaMode = value; if (value !== 'Otro') draft.payments.senaModeDetail = ''; })} options={PAYMENT_MODES} value={item.payments.senaMode} />
            {item.payments.senaMode === 'Otro' ? (
              <DataField label="Detalle modo otro" onChange={(value) => updateCase((draft) => { draft.payments.senaModeDetail = value; })} value={item.payments.senaModeDetail} />
            ) : null}
          </div>
        ) : null}

        {item.payments.invoice === 'SI' ? (
          <div className="form-grid two-columns compact-grid">
            <DataField label="Razon social" onChange={(value) => updateCase((draft) => { draft.payments.businessName = value; })} value={item.payments.businessName} />
            <DataField label="Numero factura" onChange={(value) => updateCase((draft) => { draft.payments.invoiceNumber = value; })} value={item.payments.invoiceNumber} />
          </div>
        ) : null}
      </article>

      <article className="card inner-card">
        <div className="section-head">
          <div>
            <p className="eyebrow">Cancelaciones</p>
            <h3>Parcial, total o bonificacion</h3>
          </div>
          <button className="secondary-button" onClick={addSettlement} type="button">Agregar cobro</button>
        </div>

        <div className="budget-lines">
          {item.payments.settlements.map((settlement) => (
            <div className="settlement-card" key={settlement.id}>
              <div className="form-grid four-columns compact-grid">
                <SelectField label="Cancela saldo" onChange={(value) => updateCase((draft) => {
                  const target = draft.payments.settlements.find((entry) => entry.id === settlement.id);
                  target.kind = value;
                  if (value !== 'Bonificacion') target.reason = '';
                })} options={['Parcial', 'Total', 'Bonificacion']} value={settlement.kind} />
                <DataField label="Monto" onChange={(value) => updateCase((draft) => {
                  const target = draft.payments.settlements.find((entry) => entry.id === settlement.id);
                  target.amount = value;
                })} value={settlement.amount} />
                <DataField label="Fecha" onChange={(value) => updateCase((draft) => {
                  const target = draft.payments.settlements.find((entry) => entry.id === settlement.id);
                  target.date = value;
                })} type="date" value={settlement.date} />
                <SelectField label="Modo" onChange={(value) => updateCase((draft) => {
                  const target = draft.payments.settlements.find((entry) => entry.id === settlement.id);
                  target.mode = value;
                  if (value !== 'Otro') target.modeDetail = '';
                })} options={PAYMENT_MODES} value={settlement.mode} />
              </div>

              {settlement.mode === 'Otro' ? (
                <DataField label="Detalle modo otro" onChange={(value) => updateCase((draft) => {
                  const target = draft.payments.settlements.find((entry) => entry.id === settlement.id);
                  target.modeDetail = value;
                })} value={settlement.modeDetail} />
              ) : null}

              {settlement.kind === 'Bonificacion' ? (
                <DataField label="Motivo bonificacion" onChange={(value) => updateCase((draft) => {
                  const target = draft.payments.settlements.find((entry) => entry.id === settlement.id);
                  target.reason = value;
                })} value={settlement.reason} />
              ) : null}

              <div className="form-grid five-columns compact-grid retention-grid">
                <DataField label="Ganancias" onChange={(value) => updateCase((draft) => {
                  const target = draft.payments.settlements.find((entry) => entry.id === settlement.id);
                  target.gainsRetention = value;
                })} value={settlement.gainsRetention} />
                <DataField label="IVA" onChange={(value) => updateCase((draft) => {
                  const target = draft.payments.settlements.find((entry) => entry.id === settlement.id);
                  target.ivaRetention = value;
                })} value={settlement.ivaRetention} />
                <DataField label="DREI" onChange={(value) => updateCase((draft) => {
                  const target = draft.payments.settlements.find((entry) => entry.id === settlement.id);
                  target.dreiRetention = value;
                })} value={settlement.dreiRetention} />
                <DataField label="Contr. Pat." onChange={(value) => updateCase((draft) => {
                  const target = draft.payments.settlements.find((entry) => entry.id === settlement.id);
                  target.employerContributionRetention = value;
                })} value={settlement.employerContributionRetention} />
                <DataField label="IIBB" onChange={(value) => updateCase((draft) => {
                  const target = draft.payments.settlements.find((entry) => entry.id === settlement.id);
                  target.iibbRetention = value;
                })} value={settlement.iibbRetention} />
              </div>

              <div className="actions-row compact-actions">
                <StatusBadge tone={settlement.kind === 'Bonificacion' ? 'info' : settlement.kind === 'Total' ? 'success' : 'danger'}>
                  {settlement.kind}
                </StatusBadge>
                <button className="ghost-button" onClick={() => updateCase((draft) => {
                  draft.payments.settlements = draft.payments.settlements.filter((entry) => entry.id !== settlement.id);
                })} type="button">Eliminar</button>
              </div>
            </div>
          ))}
        </div>

        <div className="receipt-demo">
          <div>
            <span>Recibo demo</span>
            <strong>{item.code}</strong>
          </div>
          <div>
            <span>Total cotizado segun comprobante {item.payments.comprobante}</span>
            <strong>{money(item.computed.totalQuoted)}</strong>
          </div>
          <div>
            <span>Saldo deudor</span>
            <strong>{money(item.computed.balance)}</strong>
          </div>
        </div>
      </article>

      <article className="card inner-card">
        <div className="section-head">
          <div>
            <p className="eyebrow">Vista contable</p>
            <h3>Ordenado por fecha de cobro</h3>
          </div>
          <StatusBadge tone="info">{paymentEvents.length} movimientos</StatusBadge>
        </div>

        <div className="table-wrap">
          <table className="data-table compact-table accounting-table">
            <thead>
              <tr>
                <th>Fecha efectivo pago</th>
                <th>Monto depositado</th>
                <th>Ganancias</th>
                <th>IVA</th>
                <th>DREI</th>
                <th>Contr. Pat.</th>
                <th>IIBB</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {paymentEvents.map((event) => (
                <tr key={event.id}>
                  <td>{formatDate(event.date)}</td>
                  <td>{money(event.amount)}</td>
                  <td>{money(event.gainsRetention)}</td>
                  <td>{money(event.ivaRetention)}</td>
                  <td>{money(event.dreiRetention)}</td>
                  <td>{money(event.employerContributionRetention)}</td>
                  <td>{money(event.iibbRetention)}</td>
                  <td>
                    <strong>{event.type}</strong>
                    <small>{event.folderName}</small>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}

function GestionView({ item, activeTab, onChangeTab, activeRepairTab, onChangeRepairTab, updateCase, flash }) {
  if (!item) {
    return (
      <div className="page-stack">
        <section className="card empty-state">
          <h2>No hay carpeta seleccionada.</h2>
          <p>Elegi un caso desde Panel General o generalo en Nuevo Caso.</p>
        </section>
      </div>
    );
  }

  const tabs = [
    { id: 'ficha', label: 'Ficha Tecnica' },
    { id: 'presupuesto', label: 'Presupuesto' },
    { id: 'gestion', label: 'Gestion reparacion' },
    { id: 'pagos', label: 'Pagos' },
  ];

  return (
    <div className="page-stack">
      <section className="hero-panel compact-hero detail-hero">
        <div>
          <p className="eyebrow">Gestion</p>
          <h1>{item.code} - {item.customer.lastName}, {item.customer.firstName}</h1>
          <p className="muted">{item.vehicle.brand} {item.vehicle.model} - {item.vehicle.plate} · cierre {item.computed.closeReady ? formatDate(item.computed.closeDate) : 'pendiente'}</p>
          <p className="muted">Siniestro {item.claimNumber || 'sin informar'}.</p>
        </div>

        <div className="status-toolbar">
          <div className="status-group">
            <span>Tramite</span>
            <StatusBadge tone={item.computed.tramiteStatus === 'Pagado' ? 'success' : item.computed.tramiteStatus === 'Pasado a pagos' ? 'info' : 'danger'}>
              {item.computed.tramiteStatus}
            </StatusBadge>
          </div>
          <div className="status-group">
            <span>Reparacion</span>
            <StatusBadge tone={item.computed.repairStatus === 'Reparado' ? 'success' : item.computed.repairStatus === 'Con Turno' ? 'info' : 'danger'}>
              {item.computed.repairStatus}
            </StatusBadge>
          </div>
          <div className="status-group muted-restricted">
            <span>Admin mock</span>
            <button className="ghost-button" disabled type="button">Rechazado / Desistido</button>
          </div>
        </div>
      </section>

      <div className="tab-strip">
        {tabs.map((tab) => (
          <TabButton
            active={activeTab === tab.id}
            key={tab.id}
            onClick={() => {
              if (tab.id === 'gestion' && !item.computed.reportClosed) {
                flash('Bloqueado: cerrá el informe del presupuesto para habilitar Gestión reparación.');
                return;
              }
              onChangeTab(tab.id);
            }}
            state={item.computed.tabs[tab.id]}
          >
            {tab.label}
          </TabButton>
        ))}
      </div>

      <div className="form-grid aside-layout">
        <div>
          {activeTab === 'ficha' ? <FichaTecnicaTab item={item} updateCase={updateCase} /> : null}
          {activeTab === 'presupuesto' ? <PresupuestoTab flash={flash} item={item} updateCase={updateCase} /> : null}
          {activeTab === 'gestion' ? (
            <GestionReparacionTab
              activeRepairTab={activeRepairTab}
              flash={flash}
              item={item}
              onChangeRepairTab={onChangeRepairTab}
              updateCase={updateCase}
            />
          ) : null}
          {activeTab === 'pagos' ? <PagosTab item={item} updateCase={updateCase} /> : null}
        </div>

        <aside className="side-panel">
          <article className="card inner-card">
            <div className="section-head small-gap">
              <h3>Bloqueos activos</h3>
              <StatusBadge tone={item.computed.blockers.length ? 'danger' : 'success'}>{item.computed.blockers.length}</StatusBadge>
            </div>
            <ul className="compact-list">
              {item.computed.blockers.map((blocker) => (
                <li key={blocker}>{blocker}</li>
              ))}
            </ul>
          </article>

          <article className="card inner-card">
            <div className="section-head small-gap">
              <h3>Cierre del caso</h3>
              <StatusBadge tone={item.computed.closeReady ? 'success' : 'danger'}>
                {item.computed.closeReady ? 'Cerrable' : 'Pendiente'}
              </StatusBadge>
            </div>
            <div className="summary-stack">
              <div className="summary-row"><span>Salida definitiva / no reingreso</span><strong>{item.computed.repairResolved ? 'Cumplido' : 'Falta resolver'}</strong></div>
              <div className="summary-row"><span>Pago total</span><strong>{item.computed.balance === 0 ? 'Cumplido' : money(item.computed.balance)}</strong></div>
              <div className="summary-row"><span>Fecha de cierre</span><strong>{item.computed.closeDate ? formatDate(item.computed.closeDate) : '-'}</strong></div>
            </div>
          </article>
        </aside>
      </div>
    </div>
  );
}

function App() {
  const [cases, setCases] = useState(initialCases);
  const [activeView, setActiveView] = useState('panel');
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [activeTab, setActiveTab] = useState('ficha');
  const [activeRepairTab, setActiveRepairTab] = useState('repuestos');
  const [notice, setNotice] = useState(null);
  const [newCaseForm, setNewCaseForm] = useState(createEmptyForm);
  const [showNewCaseValidation, setShowNewCaseValidation] = useState(false);
  const [customerLookupState, setCustomerLookupState] = useState({ status: 'idle', message: '', detail: '' });
  const [vehicleLookupState, setVehicleLookupState] = useState({ status: 'idle', message: '', detail: '' });
  const [autofilledFields, setAutofilledFields] = useState([]);

  const computedCases = useMemo(() => cases.map(getComputedCase), [cases]);

  const selectedCase = computedCases.find((item) => item.id === selectedCaseId) || computedCases[0];
  const nextCounter = computedCases.reduce((max, item) => Math.max(max, item.counter), 0) + 1;
  const nextCode = `${String(nextCounter).padStart(4, '0')}P${getBranchCode(newCaseForm.branch)}`;
  const folderMissing = getFolderMissing(newCaseForm);
  const customerMocks = useMemo(() => buildCustomerMockData(cases), [cases]);
  const vehicleMocks = useMemo(() => buildVehicleMockData(cases), [cases]);

  useEffect(() => {
    const syncCaseFromHash = () => {
      const route = getCaseRouteFromHash(window.location.hash);
      const caseId = route.id;

      if (!caseId) {
        return;
      }

      const caseExists = computedCases.some((item) => item.id === caseId);
      if (!caseExists) {
        return;
      }

      setSelectedCaseId(caseId);
      setActiveView('gestion');
      setActiveTab(route.tab || 'ficha');
      setActiveRepairTab(route.tab === 'gestion' && route.subtab ? route.subtab : 'repuestos');
    };

    syncCaseFromHash();
    window.addEventListener('hashchange', syncCaseFromHash);

    return () => window.removeEventListener('hashchange', syncCaseFromHash);
  }, [computedCases]);

  useEffect(() => {
    if (activeView !== 'gestion' || !selectedCaseId) {
      return;
    }

    const nextHash = getCaseHash(selectedCaseId, {
      tab: activeTab,
      subtab: activeTab === 'gestion' ? activeRepairTab : '',
    });

    if (window.location.hash !== nextHash) {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${nextHash}`);
    }
  }, [activeView, selectedCaseId, activeTab, activeRepairTab]);

  useEffect(() => {
    if (!autofilledFields.length) {
      return undefined;
    }

    const timer = window.setTimeout(() => setAutofilledFields([]), 1800);
    return () => window.clearTimeout(timer);
  }, [autofilledFields]);

  const updateCase = (id, mutator) => {
    setCases((current) => current.map((item) => {
      if (item.id !== id) {
        return item;
      }

      const draft = structuredClone(item);
      mutator(draft);
      return draft;
    }));
  };

  const updateSelectedCase = (mutator) => {
    if (!selectedCase) {
      return;
    }
    updateCase(selectedCase.id, mutator);
  };

  const flash = (message) => {
    const payload = typeof message === 'string' ? { tone: 'info', title: 'Aviso', message } : { title: 'Aviso', ...message };
    setNotice(payload);
    window.clearTimeout(window.__demoNoticeTimer);
    window.__demoNoticeTimer = window.setTimeout(() => setNotice(null), 3200);
  };

  const updateNewCaseField = (field, value) => {
    setNewCaseForm((current) => ({ ...current, [field]: value }));
    setAutofilledFields((current) => current.filter((item) => item !== field));

    if (field === 'document') {
      setCustomerLookupState({ status: 'idle', message: '', detail: '' });
    }

    if (field === 'plate') {
      setVehicleLookupState({ status: 'idle', message: '', detail: '' });
    }

    if (field === 'referenced' && value !== 'SI') {
      setNewCaseForm((current) => ({ ...current, referencedName: '' }));
      setAutofilledFields((current) => current.filter((item) => item !== 'referencedName'));
    }
  };

  const highlightAutofilledFields = (fields) => {
    setAutofilledFields(Array.from(new Set(fields.filter(Boolean))));
  };

  const autofillCustomerByDocument = () => {
    const document = normalizeDocument(newCaseForm.document);

    if (!document) {
      setCustomerLookupState({ status: 'empty', message: 'Ingresá un DNI', detail: 'Cargá un DNI para buscar un cliente mock.' });
      return;
    }

    const customer = customerMocks.get(document);

    if (!customer) {
      setCustomerLookupState({ status: 'empty', message: 'Sin coincidencias', detail: 'No hay un cliente mock cargado para ese DNI.' });
      return;
    }

    setNewCaseForm((current) => ({
      ...current,
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone,
      document: customer.document,
      referenced: customer.referenced,
      referencedName: customer.referencedName,
    }));
    highlightAutofilledFields([
      'document',
      'firstName',
      'lastName',
      'phone',
      'referenced',
      customer.referenced === 'SI' ? 'referencedName' : '',
    ]);
    setCustomerLookupState({
      status: 'found',
      message: 'Cliente encontrado',
      detail: `${customer.firstName} ${customer.lastName} · DNI ${customer.document}`,
    });
  };

  const autofillVehicleByPlate = () => {
    const plate = normalizePlate(newCaseForm.plate);

    if (!plate) {
      setVehicleLookupState({ status: 'empty', message: 'Ingresá una patente', detail: 'Cargá una patente para buscar un vehículo mock.' });
      return;
    }

    const vehicle = vehicleMocks.get(plate);

    if (!vehicle) {
      setVehicleLookupState({ status: 'empty', message: 'Sin coincidencias', detail: 'No hay un vehículo mock cargado para esa patente.' });
      return;
    }

    setNewCaseForm((current) => ({
      ...current,
      brand: vehicle.brand,
      model: vehicle.model,
      plate: vehicle.plate,
      vehicleType: vehicle.vehicleType,
      vehicleUse: vehicle.vehicleUse,
      paint: vehicle.paint,
    }));
    highlightAutofilledFields(['plate', 'brand', 'model', 'vehicleType', 'vehicleUse', 'paint']);
    setVehicleLookupState({
      status: 'found',
      message: 'Vehículo encontrado',
      detail: `${vehicle.brand} ${vehicle.model} · ${vehicle.plate}`,
    });
  };

  const openView = (view) => {
    setActiveView(view);

    if (view !== 'gestion' && window.location.hash) {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    }
  };

  const exportPanelExcel = (items) => {
    const rows = buildPanelExportRows(items);
    const csv = [
      ['Carpeta', 'Cliente', 'Vehiculo', 'Dominio', 'Estado del tramite', 'Estado de reparacion', 'Pagos', 'Tareas pendientes', 'Fecha estimada', 'Saldo', 'Total cotizado']
        .map(escapeCsvValue)
        .join(','),
      ...rows.map((row) => [
        row.carpeta,
        row.cliente,
        row.vehiculo,
        row.dominio,
        row.tramite,
        row.reparacion,
        row.pagos,
        row.tareasPendientes,
        row.fechaEstimada,
        row.saldo,
        row.totalCotizado,
      ].map(escapeCsvValue).join(',')),
    ].join('\n');

    triggerDownload('panel-general-particular.csv', csv, 'text/csv;charset=utf-8;');
    flash(`Exportación Excel demo generada con ${rows.length} carpetas visibles.`);
  };

  const exportPanelPdf = (items) => {
    const rows = buildPanelExportRows(items);
    const printable = window.open('', '_blank', 'noopener,noreferrer,width=1200,height=900');

    if (!printable) {
      flash('No pude abrir la ventana de impresión para el PDF demo.');
      return;
    }

    printable.document.write(`<!doctype html>
      <html lang="es">
        <head>
          <meta charset="utf-8" />
          <title>Panel General Particular</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 24px; color: #18252f; }
            h1 { margin: 0 0 8px; }
            p { margin: 0 0 16px; color: #4f6674; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #c9d5dc; padding: 8px; text-align: left; font-size: 12px; }
            th { background: #eef2f4; text-transform: uppercase; }
          </style>
        </head>
        <body>
          <h1>Panel General - Particular</h1>
          <p>Exportación demo imprimible con ${rows.length} carpetas visibles.</p>
          <table>
            <thead>
              <tr>
                <th>Carpeta</th>
                <th>Cliente</th>
                <th>Vehículo</th>
                <th>Trámite</th>
                <th>Reparación</th>
                <th>Pagos</th>
                <th>Saldo</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map((row) => `
                <tr>
                  <td>${escapeHtml(row.carpeta)}</td>
                  <td>${escapeHtml(row.cliente)}</td>
                  <td>${escapeHtml(`${row.vehiculo} - ${row.dominio}`)}</td>
                  <td>${escapeHtml(row.tramite)}</td>
                  <td>${escapeHtml(row.reparacion)}</td>
                  <td>${escapeHtml(row.pagos)}</td>
                  <td>${escapeHtml(money(row.saldo))}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </body>
      </html>`);
    printable.document.close();
    printable.focus();
    printable.print();
    flash(`Exportación PDF demo preparada para impresión con ${rows.length} carpetas visibles.`);
  };

  const openCase = (id, target = {}) => {
    const nextTab = CASE_TABS.includes(target.tab) ? target.tab : 'ficha';
    const nextRepairTab = nextTab === 'gestion' && REPAIR_TABS.includes(target.subtab) ? target.subtab : 'repuestos';

    setSelectedCaseId(id);
    setActiveView('gestion');
    setActiveTab(nextTab);
    setActiveRepairTab(nextRepairTab);
    window.location.hash = getCaseHash(id, { tab: nextTab, subtab: nextRepairTab });
  };

  const createCase = () => {
    setShowNewCaseValidation(true);

    if (folderMissing.length) {
      flash({ tone: 'danger', title: 'Validación', message: 'Faltan campos obligatorios' });
      return;
    }

    const code = `${String(nextCounter).padStart(4, '0')}P${getBranchCode(newCaseForm.branch)}`;
      const newCase = {
        id: crypto.randomUUID(),
        code,
        counter: nextCounter,
        tramiteType: newCaseForm.type,
        claimNumber: newCaseForm.claimNumber,
        branch: newCaseForm.branch,
      createdAt: new Date().toISOString().slice(0, 10),
      folderCreated: true,
      customer: {
        firstName: newCaseForm.firstName,
        lastName: newCaseForm.lastName,
        phone: newCaseForm.phone,
        document: newCaseForm.document,
        locality: 'Rosario',
        email: '',
        referenced: newCaseForm.referenced,
        referencedName: newCaseForm.referencedName,
      },
      vehicle: {
        brand: newCaseForm.brand,
        model: newCaseForm.model,
        plate: newCaseForm.plate,
        type: newCaseForm.vehicleType,
        usage: newCaseForm.vehicleUse,
        paint: newCaseForm.paint,
        year: '',
        color: '',
      },
      vehicleMedia: [],
      budget: createBudgetDefaults({
        workshop: '',
        authorizer: AUTHORIZER_OPTIONS[0],
      }),
      repair: {
        parts: [],
        turno: { date: '', estimatedDays: '', state: 'Pendiente programar', notes: '' },
        ingreso: { realDate: '', hasObservation: 'NO', observation: '', items: [] },
        egreso: {
          date: '',
          notes: '',
          shouldReenter: 'SI',
          reentryDate: '',
          reentryEstimatedDays: '',
          reentryState: 'Pendiente programar',
          reentryNotes: '',
          definitiveExit: false,
          repairedPhotos: false,
        },
      },
      payments: {
        comprobante: 'A',
        hasSena: 'NO',
        senaAmount: '',
        senaDate: '',
        senaMode: 'Transferencia',
        senaModeDetail: '',
        settlements: [],
        invoice: 'NO',
        businessName: '',
        invoiceNumber: '',
      },
    };

    setCases((current) => [...current, newCase]);
    setNewCaseForm(createEmptyForm());
    setShowNewCaseValidation(false);
    setCustomerLookupState({ status: 'idle', message: '', detail: '' });
    setVehicleLookupState({ status: 'idle', message: '', detail: '' });
    setAutofilledFields([]);
    flash({ tone: 'success', title: 'Alta exitosa', message: `Carpeta ${code} creada con éxito` });
    setActiveView('nuevo');
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-mark">DT</span>
          <div>
            <strong>Delta Taller</strong>
            <small>Particulares</small>
          </div>
        </div>

        <nav className="nav-list" aria-label="Principal">
          {NAV_ITEMS.map((item) => (
            <button className={`nav-item ${activeView === item.id ? 'is-active' : ''}`} key={item.id} onClick={() => openView(item.id)} type="button">
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-card">
          <p className="eyebrow">Logica fija</p>
          <h2>Solo Particular</h2>
          <p className="muted">Menu sin listados de otros tramites. El tipo se elige al crear el caso y la landing abre en Panel General.</p>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Demo React</p>
            <h2>{activeView === 'panel' ? 'Panel General' : activeView === 'nuevo' ? 'Nuevo Caso' : 'Gestion Particular'}</h2>
          </div>

          <div className="topbar-right">
            <StatusBadge tone="danger">Rojo pendiente</StatusBadge>
            <StatusBadge tone="info">Azul avanzado</StatusBadge>
            <StatusBadge tone="success">Verde resuelto</StatusBadge>
          </div>
        </header>

        {notice ? (
          <div className={`floating-notice ${notice.tone || 'info'}`} role="status" aria-live="polite">
            <strong>{notice.title}</strong>
            <span>{notice.message}</span>
          </div>
        ) : null}

        {activeView === 'panel' ? (
          <PanelGeneral
            flash={flash}
            items={computedCases}
            onExportExcel={exportPanelExcel}
            onExportPdf={exportPanelPdf}
            onOpenCase={openCase}
          />
        ) : null}

        {activeView === 'nuevo' ? (
          <NuevoCaso
            customerLookupState={customerLookupState}
            form={newCaseForm}
            missing={folderMissing}
            nextCode={nextCode}
            onChange={updateNewCaseField}
            onCreate={createCase}
            onSearchDocument={autofillCustomerByDocument}
            onSearchPlate={autofillVehicleByPlate}
            showValidation={showNewCaseValidation}
            autofilledFields={autofilledFields}
            vehicleLookupState={vehicleLookupState}
          />
        ) : null}

        {activeView === 'gestion' ? (
          <GestionView
            activeRepairTab={activeRepairTab}
            activeTab={activeTab}
            flash={flash}
            item={selectedCase}
            onChangeRepairTab={setActiveRepairTab}
            onChangeTab={setActiveTab}
            updateCase={updateSelectedCase}
          />
        ) : null}
      </main>
    </div>
  );
}

export default App;
