const RUT_REGEX = /^\d{7,8}[0-9K]$/i;
const PLATE_REGEX = /^[A-Z]{2,4}\d{2,4}$/i;
const PHONE_REGEX = /^(\+?56)?[9]\d{8}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRUT(rut) {
  if (!rut) return { valid: false, error: 'RUT es requerido' };
  
  const cleaned = rut.replace(/[\.\-]/g, '');
  
  if (!RUT_REGEX.test(cleaned)) {
    return { valid: false, error: 'RUT inválido' };
  }
  
  const dv = cleaned.slice(-1).toUpperCase();
  const num = cleaned.slice(0, -1);
  let sum = 0;
  let multiplier = 2;
  
  for (let i = num.length - 1; i >= 0; i--) {
    sum += parseInt(num[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  
  const expectedDV = 11 - (sum % 11);
  const calculatedDV = expectedDV === 11 ? '0' : expectedDV === 10 ? 'K' : expectedDV.toString();
  
  if (calculatedDV !== dv) {
    return { valid: false, error: 'RUT inválido' };
  }
  
  return { valid: true, error: null };
}

export function validatePlate(plate) {
  if (!plate) return { valid: false, error: 'Patente es requerida' };
  
  const cleaned = plate.replace(/[\s\-]/g, '').toUpperCase();
  
  if (!PLATE_REGEX.test(cleaned)) {
    return { valid: false, error: 'Patente inválida' };
  }
  
  return { valid: true, error: null };
}

export function validatePhone(phone) {
  if (!phone) return { valid: false, error: 'Teléfono es requerido' };
  
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  if (!PHONE_REGEX.test(cleaned)) {
    return { valid: false, error: 'Teléfono inválido' };
  }
  
  return { valid: true, error: null };
}

export function validateEmail(email) {
  if (!email) return { valid: false, error: 'Email es requerido' };
  
  if (!EMAIL_REGEX.test(email)) {
    return { valid: false, error: 'Email inválido' };
  }
  
  return { valid: true, error: null };
}

export function validateDate(dateStr) {
  if (!dateStr) return { valid: false, error: 'Fecha es requerida' };
  
  const date = new Date(dateStr);
  const today = new Date();
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 10);
  
  if (isNaN(date.getTime())) {
    return { valid: false, error: 'Fecha inválida' };
  }
  
  if (date > today) {
    return { valid: false, error: 'La fecha no puede ser futura' };
  }
  
  if (date < minDate) {
    return { valid: false, error: 'La fecha es muy antigua' };
  }
  
  return { valid: true, error: null };
}

export function validateRequired(value, fieldName) {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return { valid: false, error: `${fieldName} es requerido` };
  }
  return { valid: true, error: null };
}

export function validateNewCaseForm(formData) {
  const errors = {};
  
  const rutResult = validateRUT(formData.rut);
  if (!rutResult.valid) errors.rut = rutResult.error;
  
  const plateResult = validatePlate(formData.plate);
  if (!plateResult.valid) errors.plate = plateResult.error;
  
  const phoneResult = validatePhone(formData.phone);
  if (!phoneResult.valid) errors.phone = phoneResult.error;
  
  const emailResult = validateEmail(formData.email);
  if (!emailResult.valid) errors.email = emailResult.error;
  
  const dateResult = validateDate(formData.incidentDate);
  if (!dateResult.valid) errors.incidentDate = dateResult.error;
  
  const descResult = validateRequired(formData.description, 'Descripción');
  if (!descResult.valid) errors.description = descResult.error;
  
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}