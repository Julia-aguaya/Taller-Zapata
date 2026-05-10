export function normalizeDocument(value) {
  return String(value ?? '').replace(/\D/g, '');
}

export function normalizePlate(value) {
  return String(value ?? '').replace(/\s+/g, '').toUpperCase();
}

export function normalizePhone(value) {
  return String(value ?? '').replace(/\D/g, '');
}

export function normalizeLookupText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}