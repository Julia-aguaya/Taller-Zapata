export default function CasesToolbar({
  activeAdvancedFilterPills,
  activeAdvancedFiltersCount,
  advancedFilters,
  branchOptions,
  caseStateOptions,
  caseTypeOptions,
  draftAdvancedFiltersCount,
  hasManagerOptions,
  hasPendingAdvancedFilterChanges,
  hasPendingTaskAssigneeOptions,
  isAdvancedFiltersOpen,
  isLoading,
  managerOptions,
  onApplyAdvancedFilters,
  onClearAdvancedFilters,
  onRefresh,
  onSetAdvancedFilter,
  onToggleAdvancedFilters,
  opinionOptions,
  paymentStateOptions,
  pendingTaskAssigneeOptions,
  searchTerm,
  selectedBranch,
  selectedCaseState,
  setSearchTerm,
  setSelectedBranch,
  setSelectedCaseState,
  statusLabel,
  statusTone,
  StatusBadge,
  visibleRepairStateOptions,
  visibleTramiteStateOptions,
}) {
  const hasActiveAdvancedFilters = activeAdvancedFiltersCount > 0;
  const hasDraftAdvancedFilters = draftAdvancedFiltersCount > 0;

  return (
    <>
      <div className="section-head backend-cases-head">
        <div className="stack-tight">
          <p className="eyebrow">Carpetas</p>
          <h2>Panel de tus carpetas</h2>
          <p className="muted">
            Revisá tus carpetas activas y seguí el estado de cada caso en un solo lugar.
          </p>
        </div>

        <div className="backend-cases-actions">
          <StatusBadge tone={statusTone}>{statusLabel}</StatusBadge>
          <button
            className="secondary-button"
            disabled={isLoading}
            onClick={() => {
              void onRefresh();
            }}
            type="button"
          >
            {isLoading ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>
      </div>

      <div className="search-box backend-cases-search">
        <label htmlFor="backend-cases-search-input">Buscar carpeta</label>
        <input
          id="backend-cases-search-input"
          onChange={(event) => {
            setSearchTerm(event.target.value);
          }}
          placeholder="Ej: CAR-1024, ABC123, titular, estado"
          type="search"
          value={searchTerm}
        />
      </div>

      <div className="simple-filter-grid" role="group" aria-label="Filtros rápidos de carpetas">
        <label className="field" htmlFor="backend-cases-state-filter">
          <span>Estado del trámite</span>
          <select
            id="backend-cases-state-filter"
            onChange={(event) => setSelectedCaseState(event.target.value)}
            value={selectedCaseState}
          >
            <option value="all">Todos</option>
            {caseStateOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>

        <label className="field" htmlFor="backend-cases-branch-filter">
          <span>Sucursal</span>
          <select
            id="backend-cases-branch-filter"
            onChange={(event) => setSelectedBranch(event.target.value)}
            value={selectedBranch}
          >
            <option value="all">Todos</option>
            {branchOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>
      </div>

      <details className="card collapsible-card backend-advanced-filters" onToggle={onToggleAdvancedFilters} open={isAdvancedFiltersOpen}>
        <summary className="collapsible-summary">
          <div className="collapsible-summary-copy">
            <span className="collapsible-summary-kicker">Filtros avanzados</span>
            <strong>Afiná el listado con más criterios</strong>
            <small>
              Filtrá por fechas, tipo de carpeta, estados visibles y pendientes sin perder los filtros rápidos.
            </small>
          </div>
          <span className="collapsible-summary-meta">
            {hasActiveAdvancedFilters ? `${activeAdvancedFiltersCount} activo${activeAdvancedFiltersCount === 1 ? '' : 's'}` : 'Opcional'}
          </span>
        </summary>

        <div className="backend-advanced-filters-body">
          <div className="backend-advanced-filters-intro">
            <small>
              {hasPendingAdvancedFilterChanges
                ? 'Tenés cambios pendientes. Aplicalos cuando quieras actualizar el listado.'
                : hasActiveAdvancedFilters
                  ? 'Los filtros avanzados activos se mantienen hasta que los limpies o apliques nuevos cambios.'
                  : 'Elegí criterios y aplicalos cuando quieras refinar el listado.'}
            </small>
          </div>

          <div className="backend-advanced-filter-grid" role="group" aria-label="Filtros avanzados de carpetas">
            <label className="field" htmlFor="backend-cases-opened-from-filter">
              <span>Abierta desde</span>
              <input
                id="backend-cases-opened-from-filter"
                onChange={(event) => onSetAdvancedFilter('openedFrom', event.target.value)}
                type="date"
                value={advancedFilters.openedFrom}
              />
            </label>

            <label className="field" htmlFor="backend-cases-opened-to-filter">
              <span>Abierta hasta</span>
              <input
                id="backend-cases-opened-to-filter"
                onChange={(event) => onSetAdvancedFilter('openedTo', event.target.value)}
                type="date"
                value={advancedFilters.openedTo}
              />
            </label>

            <label className="field" htmlFor="backend-cases-paid-from-filter">
              <span>Pagado desde</span>
              <input
                id="backend-cases-paid-from-filter"
                onChange={(event) => onSetAdvancedFilter('paidFrom', event.target.value)}
                type="date"
                value={advancedFilters.paidFrom}
              />
            </label>

            <label className="field" htmlFor="backend-cases-paid-to-filter">
              <span>Pagado hasta</span>
              <input
                id="backend-cases-paid-to-filter"
                onChange={(event) => onSetAdvancedFilter('paidTo', event.target.value)}
                type="date"
                value={advancedFilters.paidTo}
              />
            </label>

            <label className="field" htmlFor="backend-cases-type-filter">
              <span>Tipo de carpeta</span>
              <select
                id="backend-cases-type-filter"
                onChange={(event) => onSetAdvancedFilter('caseTypeCode', event.target.value)}
                value={advancedFilters.caseTypeCode}
              >
                <option value="">Todos</option>
                {caseTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label className="field" htmlFor="backend-cases-payment-state-filter">
              <span>Estado de cobro</span>
              <select
                id="backend-cases-payment-state-filter"
                onChange={(event) => onSetAdvancedFilter('paymentStateCode', event.target.value)}
                value={advancedFilters.paymentStateCode}
              >
                <option value="">Todos</option>
                {paymentStateOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label className="field" htmlFor="backend-cases-opinion-filter">
              <span>Dictamen</span>
              <select
                id="backend-cases-opinion-filter"
                onChange={(event) => onSetAdvancedFilter('opinionCode', event.target.value)}
                value={advancedFilters.opinionCode}
              >
                <option value="">Todos</option>
                {opinionOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label className="field" htmlFor="backend-cases-visible-tramite-filter">
              <span>Estado visible del trámite</span>
              <select
                id="backend-cases-visible-tramite-filter"
                onChange={(event) => onSetAdvancedFilter('visibleTramiteState', event.target.value)}
                value={advancedFilters.visibleTramiteState}
              >
                <option value="">Todos</option>
                {visibleTramiteStateOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label className="field" htmlFor="backend-cases-visible-repair-filter">
              <span>Estado visible de reparación</span>
              <select
                id="backend-cases-visible-repair-filter"
                onChange={(event) => onSetAdvancedFilter('visibleRepairState', event.target.value)}
                value={advancedFilters.visibleRepairState}
              >
                <option value="">Todos</option>
                {visibleRepairStateOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label className="field" htmlFor="backend-cases-pending-tasks-filter">
              <span>Pendientes por resolver</span>
              <select
                id="backend-cases-pending-tasks-filter"
                onChange={(event) => onSetAdvancedFilter('hasPendingTasks', event.target.value)}
                value={advancedFilters.hasPendingTasks}
              >
                <option value="">Todos</option>
                <option value="true">Solo con pendientes</option>
                <option value="false">Solo sin pendientes</option>
              </select>
            </label>

            {hasManagerOptions ? (
              <label className="field" htmlFor="backend-cases-manager-filter">
                <span>Responsable interno</span>
                <select
                  id="backend-cases-manager-filter"
                  onChange={(event) => onSetAdvancedFilter('managerCode', event.target.value)}
                  value={advancedFilters.managerCode}
                >
                  <option value="">Todos</option>
                  {managerOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
            ) : (
              <label className="field" htmlFor="backend-cases-manager-filter">
                <span>Responsable interno</span>
                <input
                  id="backend-cases-manager-filter"
                  onChange={(event) => onSetAdvancedFilter('managerCode', event.target.value)}
                  placeholder="Ingresá el código si lo conocés"
                  type="text"
                  value={advancedFilters.managerCode}
                />
                <small>Si no ves opciones, podés usar el código interno que te haya compartido el taller.</small>
              </label>
            )}

            {hasPendingTaskAssigneeOptions ? (
              <label className="field" htmlFor="backend-cases-pending-task-user-filter">
                <span>Pendientes asignados a</span>
                <select
                  id="backend-cases-pending-task-user-filter"
                  onChange={(event) => onSetAdvancedFilter('pendingTaskAssignedUserId', event.target.value)}
                  value={advancedFilters.pendingTaskAssignedUserId}
                >
                  <option value="">Cualquiera</option>
                  {pendingTaskAssigneeOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
            ) : (
              <label className="field" htmlFor="backend-cases-pending-task-user-filter">
                <span>Pendientes asignados a</span>
                <input
                  id="backend-cases-pending-task-user-filter"
                  inputMode="numeric"
                  onChange={(event) => onSetAdvancedFilter('pendingTaskAssignedUserId', event.target.value)}
                  placeholder="ID interno de usuario"
                  type="text"
                  value={advancedFilters.pendingTaskAssignedUserId}
                />
                <small>Usalo solo si necesitás filtrar por una asignación interna puntual.</small>
              </label>
            )}
          </div>

          {hasActiveAdvancedFilters ? (
            <div className="backend-active-filters" aria-label="Filtros avanzados activos">
              {activeAdvancedFilterPills.map((pill) => (
                <span className="active-filter-pill" key={pill}>{pill}</span>
              ))}
            </div>
          ) : null}

          <div className="backend-advanced-filters-footer">
            <button
              className="secondary-button"
              disabled={(!hasActiveAdvancedFilters && !hasDraftAdvancedFilters) || isLoading}
              onClick={() => {
                void onClearAdvancedFilters();
              }}
              type="button"
            >
              Limpiar filtros avanzados
            </button>
            <button
              className="primary-button"
              disabled={!hasPendingAdvancedFilterChanges || isLoading}
              onClick={() => {
                void onApplyAdvancedFilters();
              }}
              type="button"
            >
              Aplicar
            </button>
          </div>
        </div>
      </details>
    </>
  );
}
