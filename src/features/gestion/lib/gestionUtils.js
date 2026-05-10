export function money(value) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export function numberValue(value) {
  const normalized = Number(String(value || '').replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(normalized) ? normalized : 0;
}

export function maxDate(a, b) {
  if (!a) {
    return b;
  }
  if (!b) {
    return a;
  }
  return new Date(`${a}T12:00:00`) > new Date(`${b}T12:00:00`) ? a : b;
}

export function getStatusTone(status) {
  if (['Pagado', 'Reparado', 'Pagado a término', 'Autorización total'].includes(status)) return 'success';
  if (['Pasado a pagos', 'Con Turno', 'En trámite', 'Acordado', 'Recibido', 'Parcial', 'Presentado (PD)', 'Autorización parcial'].includes(status)) return 'info';
  return 'danger';
}
