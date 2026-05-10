export const COVERAGE_LEVELS = {
  FULL: 'full',
  PARCIAL: 'parcial',
  BASICA: 'básica',
};

export const INSURANCE_PROCESSING_STATES = {
  PENDIENTE: 'pendiente',
  PROCESANDO: 'procesando',
  APROBADO: 'aprobado',
  RECHAZADO: 'rechazado',
};

export function parseInsuranceData(insuranceResponse) {
  if (!insuranceResponse) return null;
  
  return {
    policyNumber: insuranceResponse.numero_poliza || insuranceResponse.policyNumber,
    company: parseInsuranceCompany(insuranceResponse.compania || insuranceResponse.company),
    coverage: parseCoverageLevel(insuranceResponse.cobertura || insuranceResponse.coverage),
    startDate: insuranceResponse.fecha_inicio || insuranceResponse.startDate,
    endDate: insuranceResponse.fecha_fin || insuranceResponse.endDate,
    amount: parseAmount(insuranceResponse.monto || insuranceResponse.amount),
    processingState: insuranceResponse.estado_procesamiento || insuranceResponse.processingState || INSURANCE_PROCESSING_STATES.PENDIENTE,
    details: insuranceResponse.detalles || insuranceResponse.details,
  };
}

function parseInsuranceCompany(company) {
  if (!company) return { id: null, name: 'Unknown' };
  
  if (typeof company === 'string') {
    return { id: null, name: company };
  }
  
  return {
    id: company.id || null,
    name: company.nombre || company.name || 'Unknown',
  };
}

function parseCoverageLevel(coverage) {
  if (!coverage) return COVERAGE_LEVELS.BASICA;
  
  const normalized = String(coverage).toLowerCase().trim();
  
  if (normalized.includes('full') || normalized.includes('completa') || normalized.includes('total')) {
    return COVERAGE_LEVELS.FULL;
  }
  if (normalized.includes('parcial')) {
    return COVERAGE_LEVELS.PARCIAL;
  }
  return COVERAGE_LEVELS.BASICA;
}

function parseAmount(amount) {
  if (!amount) return 0;
  
  if (typeof amount === 'number') return amount;
  
  const parsed = parseFloat(String(amount).replace(/[^0-9.-]/g, ''));
  return isNaN(parsed) ? 0 : parsed;
}

export function findInsuranceCompany(companies, searchTerm) {
  if (!Array.isArray(companies) || !searchTerm) return null;
  
  const normalized = searchTerm.toLowerCase().trim();
  
  const found = companies.find(company => {
    const name = (company.nombre || company.name || '').toLowerCase();
    const id = String(company.id || company.idCompany || '');
    return name.includes(normalized) || id === normalized;
  });
  return found ?? null;
}

export function getCoverageLevelLabel(level) {
  const labels = {
    [COVERAGE_LEVELS.FULL]: 'Cobertura Completa',
    [COVERAGE_LEVELS.PARCIAL]: 'Cobertura Parcial',
    [COVERAGE_LEVELS.BASICA]: 'Cobertura Básica',
  };
  return labels[level] || level;
}

export function getProcessingStateLabel(state) {
  const labels = {
    [INSURANCE_PROCESSING_STATES.PENDIENTE]: 'Pendiente',
    [INSURANCE_PROCESSING_STATES.PROCESANDO]: 'Procesando',
    [INSURANCE_PROCESSING_STATES.APROBADO]: 'Aprobado',
    [INSURANCE_PROCESSING_STATES.RECHAZADO]: 'Rechazado',
  };
  return labels[state] || state;
}