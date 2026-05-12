export function applyBackendVisibleStatesToCase(item) {
  if (!item?.computed) {
    return item;
  }

  const tramite = item?.backendVisibleStates?.tramite || item?.visibleTramiteState || null;
  const reparacion = item?.backendVisibleStates?.reparacion || item?.visibleRepairState || null;

  if (!tramite?.label && !reparacion?.label) {
    return item;
  }

  return {
    ...item,
    computed: {
      ...item.computed,
      tramiteStatus: tramite?.label || item.computed.tramiteStatus,
      repairStatus: reparacion?.label || item.computed.repairStatus,
    },
  };
}

export const MANUAL_VISIBLE_STATE_OPTIONS = {
  tramite: [
    { code: '', label: 'Seguimiento automatico' },
    { code: 'SIN_PRESENTAR', label: 'Sin presentar' },
    { code: 'PRESENTADO', label: 'Presentado' },
    { code: 'EN_TRAMITE', label: 'En tramite' },
    { code: 'ACORDADO', label: 'Acordado' },
    { code: 'PASADO_A_PAGOS', label: 'Pasado a pagos' },
    { code: 'PAGADO', label: 'Pagado' },
    { code: 'RECHAZADO', label: 'Rechazado' },
    { code: 'DESISTIDO', label: 'Desistido' },
  ],
  reparacion: [
    { code: '', label: 'Seguimiento automatico' },
    { code: 'EN_TRAMITE', label: 'En tramite' },
    { code: 'FALTAN_REPUESTOS', label: 'Faltan repuestos' },
    { code: 'DAR_TURNO', label: 'Dar turno' },
    { code: 'CON_TURNO', label: 'Con turno' },
    { code: 'DEBE_REINGRESAR', label: 'Debe reingresar' },
    { code: 'REPARADO', label: 'Reparado' },
    { code: 'NO_DEBE_REPARARSE', label: 'No debe repararse' },
    { code: 'RECHAZADO', label: 'Rechazado' },
    { code: 'DESISTIDO', label: 'Desistido' },
  ],
};
