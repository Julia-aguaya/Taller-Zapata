import { useMemo, useRef, useState } from 'react';
import { ChevronDown, FolderOpen, Search, SlidersHorizontal, X } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/ui/table';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Select } from '@/shared/ui/select';
import { Card } from '@/shared/ui/card';
import { EmptyState } from '@/shared/ui/empty-state';
import {
  ADVANCED_FILTER_KEYS,
  EMPTY_CASE_FILTERS,
  buildFilterMaps,
  buildFilterChips,
  clearFilter,
  applyLocalCaseFilters,
  buildBackendCaseFilters,
  buildCaseFilterOptions,
  buildPendingTaskIndex,
  formatCodeLabel,
  getAdvancedFilterCount,
  getRenderedResultsLabel,
  sanitizeFilters,
  validateCaseFilters,
} from '@/modules/cases/lib/cases-filters';

const formatDate = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' });
};

function FilterField({ label, children, className = '' }) {
  return (
    <label className={`flex flex-col gap-2 ${className}`}>
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

export const CasesPageContent = ({
  caseTypes = [],
  insuranceCatalogs = null,
  insuranceCatalogsUnavailable = false,
  isRefreshing = false,
  items = [],
  pendingTasks = [],
  pendingTasksUnavailable = false,
  requestErrorMessage = '',
  totalCount,
  filterSourceItems = items,
  onApplyFilters,
  onOpenCase,
}) => {
  const [draftFilters, setDraftFilters] = useState(EMPTY_CASE_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_CASE_FILTERS);
  const [isMoreFiltersOpen, setIsMoreFiltersOpen] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const resultsRef = useRef(null);

  const filterOptions = useMemo(() => buildCaseFilterOptions({
    items: filterSourceItems,
    caseTypes,
    insuranceCatalogs,
    pendingTasks,
  }), [caseTypes, filterSourceItems, insuranceCatalogs, pendingTasks]);

  const filterMaps = useMemo(() => buildFilterMaps(filterOptions), [filterOptions]);
  const pendingTaskIndex = useMemo(() => buildPendingTaskIndex(pendingTasks), [pendingTasks]);
  const filteredItems = useMemo(() => applyLocalCaseFilters(items, appliedFilters, { pendingTaskIndex }), [appliedFilters, items, pendingTaskIndex]);
  const activeChips = useMemo(() => buildFilterChips(appliedFilters, filterMaps), [appliedFilters, filterMaps]);
  const advancedFilterCount = useMemo(() => getAdvancedFilterCount(appliedFilters), [appliedFilters]);
  const hasActiveFilters = activeChips.length > 0;
  const renderedCount = filteredItems.length;

  const scrollToResults = () => {
    if (typeof window === 'undefined' || !resultsRef.current) {
      return;
    }

    const fixedHeaderOffset = 112;
    const nextTop = resultsRef.current.getBoundingClientRect().top + window.scrollY - fixedHeaderOffset;

    try {
      window.scrollTo({
        top: Math.max(nextTop, 0),
        behavior: 'smooth',
      });
    } catch {
      // jsdom does not implement smooth scrolling.
    }
  };

  const updateDraftFilter = (key, value) => {
    setDraftFilters((current) => sanitizeFilters({
      ...current,
      [key]: value,
    }));
  };

  const applyFilters = () => {
    const nextFilters = sanitizeFilters(draftFilters);
    const nextValidationMessage = validateCaseFilters(nextFilters);

    setValidationMessage(nextValidationMessage);
    if (nextValidationMessage) {
      setIsMoreFiltersOpen(true);
      return;
    }

    setDraftFilters(nextFilters);
    setAppliedFilters(nextFilters);
    setIsMoreFiltersOpen(false);
    onApplyFilters?.(buildBackendCaseFilters(nextFilters));
    scrollToResults();
  };

  const handleClearFilters = () => {
    setValidationMessage('');
    setDraftFilters(EMPTY_CASE_FILTERS);
    setAppliedFilters(EMPTY_CASE_FILTERS);
    onApplyFilters?.(buildBackendCaseFilters(EMPTY_CASE_FILTERS));
  };

  const handleRemoveChip = (key) => {
    const nextFilters = clearFilter(appliedFilters, key);
    setValidationMessage('');
    setAppliedFilters(nextFilters);
    setDraftFilters(nextFilters);
    onApplyFilters?.(buildBackendCaseFilters(nextFilters));
  };

  const toggleMoreFilters = () => {
    setIsMoreFiltersOpen((current) => !current);
  };

  const hasDraftFilters = Object.values(draftFilters).some(Boolean);
  const activeSummary = getRenderedResultsLabel(renderedCount, totalCount ?? items.length, hasActiveFilters);

  return (
    <div className="space-y-5">
      <Card className="border-white/60 bg-card/95 p-5 shadow-haze sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Carpetas</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Carpetas</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Buscá y filtrá las carpetas del taller.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline">{activeSummary}</Badge>
            {isRefreshing ? <Badge variant="default">Actualizando...</Badge> : null}
          </div>
        </div>

        {requestErrorMessage ? (
          <div className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
            {`No pude actualizar las carpetas. Mantengo el ultimo listado disponible. ${requestErrorMessage}`}
          </div>
        ) : null}

        <div className="mt-5 rounded-[24px] border border-border/70 bg-background/80 p-4 shadow-sm">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_repeat(2,minmax(180px,1fr))_auto]">
            <FilterField label="Búsqueda" className="xl:col-span-1">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  aria-label="Buscar carpeta, cliente o dominio"
                  className="pl-11"
                  placeholder="Buscar por carpeta, cliente o dominio"
                  value={draftFilters.q}
                  onChange={(event) => updateDraftFilter('q', event.target.value)}
                />
              </div>
            </FilterField>

            <FilterField label="Estado de carpeta">
              <Select
                aria-label="Estado de carpeta"
                value={draftFilters.folderStatus}
                onChange={(event) => updateDraftFilter('folderStatus', event.target.value)}
              >
                <option value="">Todos</option>
                {filterOptions.folderStatuses.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </Select>
            </FilterField>

            <FilterField label="Estado del trámite">
              <Select
                aria-label="Estado del trámite"
                value={draftFilters.visibleTramiteState}
                onChange={(event) => updateDraftFilter('visibleTramiteState', event.target.value)}
              >
                <option value="">Todos</option>
                {filterOptions.visibleTramiteStates.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </Select>
            </FilterField>

            <FilterField label="Estado de reparación">
              <Select
                aria-label="Estado de reparación"
                value={draftFilters.visibleRepairState}
                onChange={(event) => updateDraftFilter('visibleRepairState', event.target.value)}
              >
                <option value="">Todos</option>
                {filterOptions.visibleRepairStates.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </Select>
            </FilterField>

          </div>

          <div className="mt-4 flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="outline"
              className="inline-flex w-fit max-w-full items-center justify-center gap-2 self-start whitespace-nowrap px-4"
              onClick={toggleMoreFilters}
              aria-expanded={isMoreFiltersOpen}
              aria-controls="cases-more-filters-panel"
            >
              <SlidersHorizontal className="h-4 w-4 shrink-0" />
              <span>{advancedFilterCount > 0 ? `Filtros avanzados · ${advancedFilterCount}` : 'Filtros avanzados'}</span>
              <ChevronDown className={`h-4 w-4 shrink-0 transition ${isMoreFiltersOpen ? 'rotate-180' : ''}`} />
            </Button>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
              <Button type="button" variant="outline" className="whitespace-nowrap" onClick={handleClearFilters} disabled={!hasActiveFilters && !hasDraftFilters}>
                Limpiar filtros
              </Button>
              <Button type="button" className="whitespace-nowrap px-4" onClick={applyFilters}>
                Aplicar filtros
              </Button>
            </div>
          </div>

          <div
            id="cases-more-filters-panel"
            className={`grid overflow-hidden transition-all duration-200 ${isMoreFiltersOpen ? 'mt-4 grid-rows-[1fr] border-t border-border/60 pt-4' : 'grid-rows-[0fr]'}`}
          >
            <div className="min-h-0">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <FilterField label="Sucursal">
                  <Select aria-label="Sucursal" value={draftFilters.branchId} onChange={(event) => updateDraftFilter('branchId', event.target.value)}>
                    <option value="">Todas</option>
                    {filterOptions.branches.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </Select>
                </FilterField>

                <FilterField label="Alta desde">
                  <Input aria-label="Alta desde" type="date" value={draftFilters.openedFrom} onChange={(event) => updateDraftFilter('openedFrom', event.target.value)} />
                </FilterField>

                <FilterField label="Alta hasta">
                  <Input aria-label="Alta hasta" type="date" value={draftFilters.openedTo} onChange={(event) => updateDraftFilter('openedTo', event.target.value)} />
                </FilterField>

                <FilterField label="Trámite">
                  <Select aria-label="Trámite" value={draftFilters.caseTypeCode} onChange={(event) => updateDraftFilter('caseTypeCode', event.target.value)}>
                    <option value="">Todos</option>
                    {filterOptions.caseTypes.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </Select>
                </FilterField>

                <FilterField label="Pago desde">
                  <Input aria-label="Pago desde" type="date" value={draftFilters.paidFrom} onChange={(event) => updateDraftFilter('paidFrom', event.target.value)} />
                </FilterField>

                <FilterField label="Pago hasta">
                  <Input aria-label="Pago hasta" type="date" value={draftFilters.paidTo} onChange={(event) => updateDraftFilter('paidTo', event.target.value)} />
                </FilterField>

                {filterOptions.opinions.length > 0 ? (
                  <FilterField label="Dictamen">
                    <Select aria-label="Dictamen" value={draftFilters.opinionCode} onChange={(event) => updateDraftFilter('opinionCode', event.target.value)}>
                      <option value="">Todos</option>
                      {filterOptions.opinions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </Select>
                  </FilterField>
                ) : (
                  <FilterField label="Dictamen">
                    <Input aria-label="Dictamen" placeholder="Código exacto del dictamen" value={draftFilters.opinionCode} onChange={(event) => updateDraftFilter('opinionCode', event.target.value)} />
                    {insuranceCatalogsUnavailable ? <span className="text-xs text-muted-foreground">Todavía no hay opciones disponibles para este filtro.</span> : null}
                  </FilterField>
                )}

                <FilterField label="Gestor">
                  {filterOptions.managers.length > 0 ? (
                    <Select aria-label="Gestor" value={draftFilters.managerCode} onChange={(event) => updateDraftFilter('managerCode', event.target.value)}>
                      <option value="">Todos</option>
                      {filterOptions.managers.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </Select>
                  ) : (
                    <>
                      <Input aria-label="Gestor" placeholder="Código exacto del gestor" value={draftFilters.managerCode} onChange={(event) => updateDraftFilter('managerCode', event.target.value)} />
                      <span className="text-xs text-muted-foreground">Por ahora se filtra por código, sin inventar nombres.</span>
                    </>
                  )}
                </FilterField>

                <FilterField label="Estado de pago">
                  <Select aria-label="Estado de pago" value={draftFilters.paymentStateCode} onChange={(event) => updateDraftFilter('paymentStateCode', event.target.value)}>
                    <option value="">Todos</option>
                    {filterOptions.paymentStates.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </Select>
                </FilterField>

                <FilterField label="Tareas pendientes">
                  <Select aria-label="Tareas pendientes" value={draftFilters.hasPendingTasks} onChange={(event) => updateDraftFilter('hasPendingTasks', event.target.value)}>
                    <option value="">Todas</option>
                    <option value="true">Solo con tareas pendientes</option>
                    <option value="false">Solo sin tareas pendientes</option>
                  </Select>
                </FilterField>

                {filterOptions.pendingTaskAssignees.length > 0 ? (
                  <FilterField label="Responsable">
                    <Select aria-label="Responsable" value={draftFilters.pendingTaskAssignedUserId} onChange={(event) => updateDraftFilter('pendingTaskAssignedUserId', event.target.value)}>
                      <option value="">Cualquiera</option>
                      {filterOptions.pendingTaskAssignees.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </Select>
                  </FilterField>
                ) : (
                  <FilterField label="Responsable">
                    <Input
                      aria-label="Responsable"
                      inputMode="numeric"
                      placeholder="ID exacto del responsable"
                      value={draftFilters.pendingTaskAssignedUserId}
                      onChange={(event) => updateDraftFilter('pendingTaskAssignedUserId', event.target.value)}
                    />
                    <span className="text-xs text-muted-foreground">Todavía no hay nombres visibles para responsables; podés filtrar por ID exacto.</span>
                  </FilterField>
                )}
              </div>

              {validationMessage ? (
                <div className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
                  {validationMessage}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </Card>

      {hasActiveFilters ? (
        <div className="flex flex-wrap gap-2" aria-label="Filtros activos">
          {activeChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => handleRemoveChip(chip.key)}
              className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition hover:bg-primary/15"
              aria-label={`Quitar filtro ${chip.text}`}
            >
              <span>{chip.text}</span>
              <X className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>
      ) : null}

      <div ref={resultsRef} aria-hidden="true" />

      {renderedCount === 0 ? (
        <div className="space-y-4">
          <EmptyState title="No hay carpetas para esos filtros" description="Proba limpiando o ajustando los criterios aplicados para volver a ver resultados." />
          <div className="flex justify-center">
            <Button type="button" variant="outline" onClick={handleClearFilters}>Limpiar filtros</Button>
          </div>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Carpeta</TableHead>
              <TableHead>Cliente / Vehículo</TableHead>
              <TableHead>Trámite</TableHead>
              <TableHead className="w-32">Estado del trámite</TableHead>
              <TableHead className="w-32">Estado de reparación</TableHead>
              <TableHead className="w-28">Creada</TableHead>
              <TableHead className="w-20">Cierre</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-semibold">{item.folderCode}</TableCell>
                <TableCell>
                  <span className="text-sm">{item.principalCustomerName || '-'}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{item.principalVehiclePlate || ''}</span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{formatCodeLabel(item.caseTypeCode, item.caseTypeCode || '-')}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={item.visibleTramiteState?.code === 'PAGADO' ? 'success' : (item.visibleTramiteState?.code === 'PASADO_A_PAGOS' ? 'destructive' : 'secondary')}>
                    {item.visibleTramiteState?.label || formatCodeLabel(item.currentCaseStateCode, '-')}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={item.visibleRepairState?.code === 'REPARADO' ? 'success' : (item.visibleRepairState?.code === 'DAR_TURNO' ? 'destructive' : 'outline')}>
                    {item.visibleRepairState?.label || formatCodeLabel(item.currentRepairStateCode, '-')}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatDate(item.closedAt)}</TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" onClick={() => onOpenCase(item)}>
                    <FolderOpen className="mr-1 h-3.5 w-3.5" />
                    Abrir
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export const getCasesAdvancedFilterKeys = () => ADVANCED_FILTER_KEYS;
