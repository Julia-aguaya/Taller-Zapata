export function formatBackendState(code, fallback = 'Sin dato') {
  if (!code) {
    return fallback;
  }

  return String(code)
    .split(/[._-]+/)
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1).toLowerCase())
    .join(' ');
}

export function formatCaseNumber(folderCode) {
  if (!folderCode) return '';
  return folderCode.toUpperCase();
}

export function formatDate(date) {
  if (!date) {
    return '-';
  }

  return new Intl.DateTimeFormat('es-AR').format(new Date(`${date}T12:00:00`));
}

export function formatCurrency(amount) {
  if (amount === null || amount === undefined || amount === '') {
    return '-';
  }

  const normalized = Number(String(amount).replace(/\./g, '').replace(',', '.'));
  if (!Number.isFinite(normalized)) {
    return '-';
  }

  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(normalized);
}