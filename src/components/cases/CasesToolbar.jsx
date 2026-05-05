export default function CasesToolbar({
  branchOptions,
  caseStateOptions,
  isLoading,
  onRefresh,
  searchTerm,
  selectedBranch,
  selectedCaseState,
  setSearchTerm,
  setSelectedBranch,
  setSelectedCaseState,
  statusLabel,
  statusTone,
  StatusBadge,
}) {
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
          <button className="secondary-button" disabled={isLoading} onClick={() => { void onRefresh(); }} type="button">
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
    </>
  );
}
