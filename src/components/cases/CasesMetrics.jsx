export default function CasesMetrics({
  filteredItems,
  hasFilteredItems,
  isLoading,
  normalizedSearchTerm,
  state,
  formatDateTime,
}) {
  return (
    <div className="backend-cases-metrics" role="list" aria-label="Resumen de carpetas reales">
      <article className="backend-case-metric" role="listitem">
        <span>Carpetas en pantalla</span>
        <strong>{hasFilteredItems ? filteredItems.length : 0}</strong>
        <small>{normalizedSearchTerm ? 'Coincidencias con tu búsqueda actual.' : 'Vista rápida de las carpetas disponibles.'}</small>
      </article>
      <article className="backend-case-metric" role="listitem">
        <span>Total de carpetas</span>
        <strong>{state.total}</strong>
        <small>{state.total > state.visible ? 'Hay más carpetas además de las que ves ahora.' : 'Ya estás viendo todas las carpetas disponibles.'}</small>
      </article>
      <article className="backend-case-metric" role="listitem">
        <span>Actualización</span>
        <strong>{state.checkedAt ? formatDateTime(state.checkedAt) : '-'}</strong>
        <small>{isLoading ? 'Estamos refrescando la información.' : 'Podés volver a actualizar cuando lo necesites.'}</small>
      </article>
    </div>
  );
}
