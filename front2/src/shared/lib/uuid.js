// crypto.randomUUID() solo existe en secure contexts (HTTPS o localhost).
// En producción se accede por HTTP puro, así que ahí la función no existe.
// crypto.getRandomValues() sí está disponible en cualquier contexto,
// por eso el fallback genera un UUID v4 con bytes criptográficamente seguros.
export function randomUuid() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // versión 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variante RFC 4122
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  // Último recurso para entornos sin Web Crypto: no es criptográficamente seguro,
  // pero garantiza formato UUID v4 único en la práctica.
  const hex = Array.from({ length: 16 }, (_, i) => {
    const byte = Math.floor(Math.random() * 256);
    return i === 6 ? ((byte & 0x0f) | 0x40) : i === 8 ? ((byte & 0x3f) | 0x80) : byte;
  });
  const hexStr = hex.map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hexStr.slice(0, 8)}-${hexStr.slice(8, 12)}-${hexStr.slice(12, 16)}-${hexStr.slice(16, 20)}-${hexStr.slice(20)}`;
}
