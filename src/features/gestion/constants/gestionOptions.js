// ── Budget options ──
export const BUDGET_DAMAGE_OPTIONS = ['Daño leve (0 a 8%)', 'Daño medio (8 a 25%)', 'Daño fuerte (+ 25%)', 'Igualacion'];
export const BUDGET_TASK_OPTIONS = [
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
export const BUDGET_PART_DECISION_OPTIONS = ['Debe reemplazarse', 'Puede repararse', 'A verificar'];

// ── Repair options ──
export const REPAIR_PART_STATE_OPTIONS = ['Pendiente', 'Pedido', 'Encargado', 'Recibido', 'Devuelto', 'Devolver'];
export const REPAIR_PART_BUYER_OPTIONS = ['Taller', 'Cliente'];
export const REPAIR_PART_PAYMENT_OPTIONS = ['Pendiente', 'Cancelado'];

// ── General options ──
export const TURNO_STATE_OPTIONS = ['Pendiente programar', 'Probable a confirmar', 'A confirmar cliente', 'Confirmado', 'Reprogramar'];
export const INGRESO_TYPES = ['Carrocería', 'Mecánica', 'Accesorios', 'Otro'];

// ── Vehicle / Customer options ──
export const VEHICLE_BRAND_OPTIONS = ['Chevrolet', 'Peugeot', 'Volkswagen', 'Fiat', 'Ford', 'Renault', 'Toyota', 'Citroen', 'Jeep', 'Nissan'];
export const TRANSMISSION_OPTIONS = ['Manual', 'Automatica', 'CVT', 'Secuencial'];
export const CIVIL_STATUS_OPTIONS = ['Soltero/a', 'Casado/a', 'Divorciado/a', 'Viudo/a', 'Otro'];

// ── Shared options ──
export const OWNERSHIP_PERCENTAGE_OPTIONS = ['100%', '50%'];
export const REPORT_STATUS_OPTIONS = ['Informe cerrado', 'Informe abierto'];
export const YES_NO_AV_OPTIONS = ['SI', 'NO', 'A/V'];

// ── Workshop options ──
export const WORKSHOP_OPTIONS = ['Talleres Zapata', 'Taller Casablanca', 'Taller Repararte'];

export const WORKSHOPS = [
  {
    id: 'zapata',
    label: 'Taller Zapata',
    legalName: 'Talleres Zapata SRL',
    taxId: '30-54986217-5',
    taxCondition: 'Responsable Inscripto',
    address: 'Bv. Oroño 2150 · Rosario',
    phone: '341 426 1200',
    email: 'contacto@tallereszapata.com',
    logo: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=320&q=80',
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
    logo: 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=320&q=80',
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
    logo: 'https://images.unsplash.com/photo-1453475250267-163ff185e88b?auto=format&fit=crop&w=320&q=80',
  },
];

// ── Payment options ──
export const PAYMENT_MODES = ['Transferencia', 'Efectivo', 'Debito', 'Credito', 'Otro'];
export const COMPROBANTES = ['A', 'C', 'R'];

// ── Authorizer options ──
export const AUTHORIZER_OPTIONS = ['PABLO ZAPATA', 'ENRIQUE ZAPATA', 'MELINA ZAPATA', 'DAMIAN ZAPATA'];

// ── Franchise options ──
export const FRANCHISE_MANAGER_OPTIONS = ['Taller', 'Abogado'];
export const FRANCHISE_RECOVERY_DICTAMEN_OPTIONS = ['Pendiente', 'A favor', 'Rechazado', 'Culpa compartida'];
export const FRANCHISE_CLIENT_PAYMENT_STATUS_OPTIONS = ['Pendiente', 'Cancelado'];

// ── Todo Riesgo options ──
export const TODO_RIESGO_INSURANCE_OPTIONS = ['La Segunda', 'Sancor Seguros', 'Federación Patronal', 'Mercantil Andina', 'Rivadavia'];
export const TODO_RIESGO_ASSIGNABLE_USERS = ['Melina Z', 'Pablo Z', 'Romina G', 'Damian Z'];
export const TODO_RIESGO_RECOVERY_OPTIONS = ['Cía. del 3ero', 'Abona cliente', '3ero particular', 'Propia Cía.'];
export const TODO_RIESGO_DICTAMEN_OPTIONS = ['Pendiente', 'A favor', 'Rechazado'];
export const TODO_RIESGO_DOC_CATEGORY_OPTIONS = ['Personal', 'Vehículo', 'Seguro', '3ero', 'Otro'];
export const TODO_RIESGO_MODALITY_OPTIONS = ['Presencial', 'Por fotos'];
export const TODO_RIESGO_QUOTE_STATUS_OPTIONS = ['Pendiente', 'Acordada', 'Observada'];
export const TODO_RIESGO_FRANCHISE_STATUS_OPTIONS = ['Sin Franquicia', 'Pendiente', 'Cobrada', 'Bonificada'];

// ── CLEAS options ──
export const CLEAS_SCOPE_OPTIONS = ['Sobre franquicia', 'Sobre daño total'];
export const CLEAS_DICTAMEN_OPTIONS = ['A favor', 'En contra', 'Culpa compartida', 'Pendiente'];
export const CLEAS_PAYMENT_STATUS_OPTIONS = ['Pendiente', 'Cancelado'];

// ── Third Party options ──
export const THIRD_PARTY_PARTS_PROVIDER_OPTIONS = ['Provee Cía.', 'Provee Taller', 'Provee cliente'];
export const THIRD_PARTY_ORDER_STATE_OPTIONS = ['Pendiente', 'Encargado', 'Recibido', 'Devolver'];
export const THIRD_PARTY_BILLING_OPTIONS = ['A', 'C', 'Sin F'];
export const THIRD_PARTY_PAYMENT_OPTIONS = ['Tarjeta 1 pago', 'Tarjetas cuotas', 'Contado'];

// ── Lawyer options ──
export const LAWYER_INJURED_ROLE_OPTIONS = ['titular registral', 'cliente', 'otro'];
export const LAWYER_GENERAL_DOC_CATEGORY_OPTIONS = ['Personal', 'Vehículo', 'Seguro', 'Tercero', 'Otro'];
export const LAWYER_EXPEDIENT_DOC_CATEGORY_OPTIONS = ['Escrito', 'Cédula', 'Prueba', 'Honorarios', 'Pericia', 'Otro'];
export const LAWYER_TRAMITA_OPTIONS = ['Con Poder', 'Con Patrocinio'];
export const LAWYER_RECLAMA_OPTIONS = ['Daño material', 'Daño material y lesiones', 'Franquicia', 'Franquicia y lesiones'];
export const LAWYER_INSTANCE_OPTIONS = ['Administrativa', 'Judicial'];
export const LAWYER_CLOSE_BY_OPTIONS = ['pendiente', 'conciliación', 'sentencia', 'desistimiento'];
export const LAWYER_EXPENSE_PAID_BY_OPTIONS = ['CLIENTE', 'ABOGADO', 'TALLER', 'ASEGURADORA'];

// ── Task options ──
export const TASK_STATUS_OPTIONS = ['pendiente', 'en curso', 'resuelta'];
export const TASK_PRIORITY_OPTIONS = ['alta', 'media', 'baja'];
