import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CalendarClock, ChevronDown, CircleDollarSign, Clock3, FolderOpen, RefreshCw, Search, SlidersHorizontal, X } from 'lucide-react';
import { listOperationalTasks } from '@/modules/agenda/api/agenda-api';
import { getCaseCatalogs } from '@/modules/cases/api/new-case-api';
import { getTaskDisplayStatus } from '@/modules/agenda/lib/agenda-helpers';
import { listCases } from '@/modules/cases/api/cases-api';
import { getPanelGeneral } from '@/modules/panel/api/panel-api';
import { resolveCasePriorityState } from '@/modules/panel/lib/panel-priority';
import {
  EMPTY_CASE_FILTERS,
  applyLocalCaseFilters,
  buildCaseFilterOptions,
  buildFilterChips,
  buildFilterMaps,
  buildPendingTaskIndex,
  clearFilter,
  formatCodeLabel,
  getAdvancedFilterCount,
  getFolderStatusCode,
  sanitizeFilters,
  validateCaseFilters,
} from '@/modules/cases/lib/cases-filters';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { EmptyState } from '@/shared/ui/empty-state';
import { FullScreenLoader } from '@/shared/ui/full-screen-loader';
import { Input } from '@/shared/ui/input';
import { Select } from '@/shared/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

const VIEW_OPTIONS = [
  { id: 'priority', label: 'Prioridades' },
  { id: 'open', label: 'Todos los abiertos' },
  { id: 'closed', label: 'Cerrados' },
];

const PRIORITY_REASON_MATCHERS = {
  pendingPayments: (item) => item.panelPriorityState.reasonTypes.has('PAYMENT'),
  casesWithoutAppointment: (item) => item.panelPriorityState.reasonTypes.has('APPOINTMENT'),
  casesNearPrescription: (item) => item.panelPriorityState.reasonTypes.has('PRESCRIPTION'),
  pendingTaskCases: (item) => item.panelPriorityState.reasonTypes.has('TASK'),
};

const METRIC_CARDS = [
  {
    key: 'openCases',
    label: 'Casos abiertos',
    helper: 'Seguimiento activo',
    icon: Clock3,
    tone: 'sky',
  },
  {
    key: 'pendingPayments',
    label: 'Pagos pendientes',
    helper: 'Listos para cobrar',
    icon: CircleDollarSign,
    tone: 'amber',
  },
  {
    key: 'casesWithoutAppointment',
    label: 'Pendientes de turno',
    helper: 'Sin turno asignado',
    icon: CalendarClock,
    tone: 'orange',
  },
  {
    key: 'casesNearPrescription',
    label: 'Próximos a prescribir',
    helper: 'Prescripción cercana',
    icon: AlertTriangle,
    tone: 'red',
  },
  {
    key: 'pendingTaskCases',
    label: 'Con tareas pendientes',
    helper: 'Pendientes o vencidas',
    icon: FolderOpen,
    tone: 'slate',
  },
];

const priorityBadgeVariantByCode = {
  URGENT: 'destructive',
  ATTENTION: 'secondary',
};

const metricToneClassMap = {
  sky: {
    active: 'border-[hsl(var(--metric-sky-accent)/0.7)] bg-background/80 text-foreground shadow-[0_18px_36px_-28px_rgba(14,165,233,0.45)] md:bg-[hsl(var(--metric-sky-accent)/0.16)]',
    idle: 'border-border/70 bg-background/80 text-foreground hover:border-[hsl(var(--metric-sky-accent)/0.45)] md:hover:bg-[hsl(var(--metric-sky-accent)/0.08)]',
    icon: 'text-[hsl(var(--metric-sky-accent))]',
    value: 'text-[hsl(var(--metric-sky-accent))]',
  },
  amber: {
    active: 'border-[hsl(var(--metric-amber-accent)/0.7)] bg-background/80 text-foreground shadow-[0_18px_36px_-28px_rgba(245,158,11,0.4)] md:bg-[hsl(var(--metric-amber-accent)/0.16)]',
    idle: 'border-border/70 bg-background/80 text-foreground hover:border-[hsl(var(--metric-amber-accent)/0.45)] md:hover:bg-[hsl(var(--metric-amber-accent)/0.08)]',
    icon: 'text-[hsl(var(--metric-amber-accent))]',
    value: 'text-[hsl(var(--metric-amber-accent))]',
  },
  orange: {
    active: 'border-[hsl(var(--metric-red-accent)/0.7)] bg-background/80 text-foreground shadow-[0_18px_36px_-28px_rgba(244,63,94,0.4)] md:border-[hsl(var(--metric-orange-accent)/0.7)] md:bg-[hsl(var(--metric-orange-accent)/0.16)] md:shadow-[0_18px_36px_-28px_rgba(249,115,22,0.4)]',
    idle: 'border-border/70 bg-background/80 text-foreground hover:border-[hsl(var(--metric-red-accent)/0.45)] md:hover:border-[hsl(var(--metric-orange-accent)/0.45)] md:hover:bg-[hsl(var(--metric-orange-accent)/0.08)]',
    icon: 'text-[hsl(var(--metric-red-accent))] md:text-[hsl(var(--metric-orange-accent))]',
    value: 'text-[hsl(var(--metric-red-accent))] md:text-[hsl(var(--metric-orange-accent))]',
  },
  red: {
    active: 'border-[hsl(var(--metric-red-accent)/0.7)] bg-background/80 text-foreground shadow-[0_18px_36px_-28px_rgba(244,63,94,0.4)] md:bg-[hsl(var(--metric-red-accent)/0.16)]',
    idle: 'border-border/70 bg-background/80 text-foreground hover:border-[hsl(var(--metric-red-accent)/0.45)] md:hover:bg-[hsl(var(--metric-red-accent)/0.08)]',
    icon: 'text-[hsl(var(--metric-red-accent))]',
    value: 'text-[hsl(var(--metric-red-accent))]',
  },
  slate: {
    active: 'border-[hsl(var(--metric-slate-accent)/0.7)] bg-background/80 text-foreground shadow-[0_18px_36px_-28px_rgba(51,65,85,0.4)] md:bg-[hsl(var(--metric-slate-accent)/0.16)]',
    idle: 'border-border/70 bg-background/80 text-foreground hover:border-[hsl(var(--metric-slate-accent)/0.45)] md:hover:bg-[hsl(var(--metric-slate-accent)/0.08)]',
    icon: 'text-[hsl(var(--metric-slate-accent))]',
    value: 'text-[hsl(var(--metric-slate-accent))]',
  },
  neutral: {
    active: 'border-border bg-muted/60 text-foreground',
    idle: 'border-border/70 bg-background/70 text-foreground hover:border-border',
    icon: 'text-muted-foreground',
    value: 'text-muted-foreground',
  },
};

const formatDateTime = (value) => {
  if (!value) return '-';

  return new Date(value).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
};

const resolvePaymentBadgeVariant = (code) => {
  const normalized = String(code || '').trim().toUpperCase();
  if (normalized === 'PAGADO') return 'success';
  if (normalized === 'PENDIENTE' || normalized === 'PASADO_A_PAGOS') return 'destructive';
  return 'outline';
};

const resolveRepairBadgeVariant = (code) => {
  const normalized = String(code || '').trim().toUpperCase();
  if (normalized === 'REPARADO') return 'success';
  if (normalized === 'DAR_TURNO' || normalized === 'SIN_TURNO') return 'destructive';
  return 'outline';
};

const buildPriorityIndex = (priorityBuckets = []) => priorityBuckets.reduce((accumulator, bucket, bucketIndex) => {
  (bucket.items || []).forEach((item, itemIndex) => {
    accumulator.set(String(item.caseId), {
      bucketCode: bucket.code,
      bucketLabel: bucket.label,
      bucketIndex,
      itemIndex,
      priorityReasons: item.priorityReasons || [],
      panelItem: item,
    });
  });

  return accumulator;
}, new Map());

const buildTaskMetaIndex = (tasks = []) => tasks.reduce((accumulator, task) => {
  if (!task || task.caseId == null) {
    return accumulator;
  }

  const displayStatus = getTaskDisplayStatus(task);
  if (!displayStatus.isActive) {
    return accumulator;
  }

  const caseKey = String(task.caseId);
  const current = accumulator.get(caseKey) || {
    hasActiveTasks: false,
    hasOverdueTasks: false,
    count: 0,
  };

  current.hasActiveTasks = true;
  current.count += 1;
  if (displayStatus.bucket === 'OVERDUE') {
    current.hasOverdueTasks = true;
  }

  accumulator.set(caseKey, current);
  return accumulator;
}, new Map());

const buildMergedItems = (cases = [], priorityIndex = new Map()) => {
  const items = cases.map((item, sourceIndex) => {
    const priorityMeta = priorityIndex.get(String(item.id));

    return {
      ...item,
      sourceIndex,
      panelPriority: priorityMeta,
      priorityReasons: priorityMeta?.priorityReasons || [],
      priorityBucketLabel: priorityMeta?.bucketLabel || '',
      priorityBucketCode: priorityMeta?.bucketCode || '',
    };
  });

  priorityIndex.forEach((meta, caseId) => {
    if (items.some((item) => String(item.id) === caseId)) {
      return;
    }

    items.push({
      id: meta.panelItem.caseId,
      folderCode: meta.panelItem.folderCode,
      orderNumber: null,
      principalCustomerName: meta.panelItem.title,
      principalVehiclePlate: '',
      caseTypeCode: meta.panelItem.caseTypeCode,
      currentPaymentStateCode: '',
      visibleTramiteState: meta.panelItem.visibleTramiteState,
      visibleRepairState: meta.panelItem.visibleRepairState,
      createdAt: meta.panelItem.createdAt,
      closedAt: meta.panelItem.closedAt,
      sourceIndex: Number.MAX_SAFE_INTEGER + meta.bucketIndex * 100 + meta.itemIndex,
      panelPriority: meta,
      priorityReasons: meta.priorityReasons || [],
      priorityBucketLabel: meta.bucketLabel,
      priorityBucketCode: meta.bucketCode,
    });
  });

  return items;
};

const sortVisibleItems = (items = [], selectedView = 'priority') => {
  if (selectedView === 'priority') {
    return [...items].sort((left, right) => {
      const leftBucket = left.panelPriority?.bucketIndex ?? Number.MAX_SAFE_INTEGER;
      const rightBucket = right.panelPriority?.bucketIndex ?? Number.MAX_SAFE_INTEGER;
      if (leftBucket !== rightBucket) {
        return leftBucket - rightBucket;
      }

      const leftIndex = left.panelPriority?.itemIndex ?? left.sourceIndex ?? Number.MAX_SAFE_INTEGER;
      const rightIndex = right.panelPriority?.itemIndex ?? right.sourceIndex ?? Number.MAX_SAFE_INTEGER;
      if (leftIndex !== rightIndex) {
        return leftIndex - rightIndex;
      }

      return (left.sourceIndex ?? Number.MAX_SAFE_INTEGER) - (right.sourceIndex ?? Number.MAX_SAFE_INTEGER);
    });
  }

  return [...items].sort((left, right) => (left.sourceIndex ?? Number.MAX_SAFE_INTEGER) - (right.sourceIndex ?? Number.MAX_SAFE_INTEGER));
};

const getPriorityLabel = (item) => {
  if (item.panelPriorityState.priorityLabel) return item.panelPriorityState.priorityLabel;
  if (item.closedAt) return 'Cerrado';
  return 'Seguimiento';
};

const matchesMetric = (item, metricKey, taskMetaIndex) => {
  if (!metricKey) return true;
  if (metricKey === 'openCases') {
    return !item.closedAt && getFolderStatusCode(item) === 'ABIERTA';
  }

  if (metricKey === 'pendingTaskCases') {
    return item.panelPriorityState.reasonTypes.has('TASK');
  }

  const matcher = PRIORITY_REASON_MATCHERS[metricKey];
  if (!matcher) return true;
  return matcher(item, taskMetaIndex);
};

const buildMetricCounts = (items, taskMetaIndex) => ({
  openCases: items.filter((item) => !item.closedAt && getFolderStatusCode(item) === 'ABIERTA').length,
  pendingPayments: items.filter((item) => matchesMetric(item, 'pendingPayments', taskMetaIndex)).length,
  casesWithoutAppointment: items.filter((item) => matchesMetric(item, 'casesWithoutAppointment', taskMetaIndex)).length,
  casesNearPrescription: items.filter((item) => matchesMetric(item, 'casesNearPrescription', taskMetaIndex)).length,
  pendingTaskCases: items.filter((item) => matchesMetric(item, 'pendingTaskCases', taskMetaIndex)).length,
});

function FilterField({ label, children, className = '' }) {
  return (
    <label className={`flex flex-col gap-2 ${className}`}>
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function CasePriorityBadge({ item }) {
  const priorityCode = item.panelPriorityState.priorityBucketCode;

  return <Badge variant={priorityBadgeVariantByCode[priorityCode] || 'outline'}>{getPriorityLabel(item)}</Badge>;
}

function CaseTramiteBadge({ item }) {
  return (
    <Badge variant={item.visibleTramiteState?.code === 'PAGADO' ? 'success' : 'secondary'}>
      {item.visibleTramiteState?.label || formatCodeLabel(item.currentCaseStateCode, 'Sin dato')}
    </Badge>
  );
}

function CaseRepairBadge({ item }) {
  return (
    <Badge variant={resolveRepairBadgeVariant(item.visibleRepairState?.code || item.currentRepairStateCode)}>
      {item.visibleRepairState?.label || formatCodeLabel(item.currentRepairStateCode, 'Sin dato')}
    </Badge>
  );
}

function CasePaymentBadge({ item }) {
  return (
    <Badge variant={resolvePaymentBadgeVariant(item.currentPaymentStateCode)}>
      {formatCodeLabel(item.currentPaymentStateCode, 'Sin dato')}
    </Badge>
  );
}

function formatPendingTasks(count) {
  return `${count} tarea${count === 1 ? '' : 's'} pendiente${count === 1 ? '' : 's'}`;
}

function CaseReasons({ item, pendingTaskCount = 0, showEmpty = true }) {
  if (!item.panelPriorityState.validReasons.length) {
    return showEmpty ? <Badge variant="outline">Sin alertas</Badge> : null;
  }

  return item.panelPriorityState.validReasons.map((reason) => (
    <Badge key={`${item.id}-${reason}`} variant="destructive" className="text-[10px]">
      {item.panelPriorityState.reasonTypes.has('TASK') && reason.toLowerCase().startsWith('tareas pendientes')
        ? formatPendingTasks(pendingTaskCount)
        : reason}
    </Badge>
  ));
}

export const PanelPage = () => {
  const navigate = useNavigate();
  const resultsRef = useRef(null);
  const [selectedView, setSelectedView] = useState('priority');
  const [selectedMetric, setSelectedMetric] = useState('');
  const [draftFilters, setDraftFilters] = useState(EMPTY_CASE_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_CASE_FILTERS);
  const [isMoreFiltersOpen, setIsMoreFiltersOpen] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');

  const panelQuery = useQuery({
    queryKey: ['panel', 'general'],
    queryFn: getPanelGeneral,
  });
  const casesQuery = useQuery({
    queryKey: ['panel', 'cases'],
    queryFn: () => listCases({ size: 200 }),
    placeholderData: (previousData) => previousData,
  });
  const caseCatalogsQuery = useQuery({
    queryKey: ['cases', 'catalogs'],
    queryFn: getCaseCatalogs,
    retry: false,
  });
  const tasksQuery = useQuery({
    queryKey: ['panel', 'tasks'],
    queryFn: () => listOperationalTasks({ size: 500 }),
    retry: false,
  });

  const priorityBuckets = panelQuery.data?.priorityBuckets || [];
  const generatedAt = panelQuery.data?.generatedAt;
  const caseItems = casesQuery.data?.items || [];
  const pendingTasks = tasksQuery.data?.items ?? tasksQuery.data?.content ?? tasksQuery.data ?? [];
  const priorityIndex = useMemo(() => buildPriorityIndex(priorityBuckets), [priorityBuckets]);
  const mergedItems = useMemo(() => buildMergedItems(caseItems, priorityIndex), [caseItems, priorityIndex]);
  const filterOptions = useMemo(
    () => buildCaseFilterOptions({
      items: mergedItems,
      caseTypes: caseCatalogsQuery.data?.caseTypes ?? [],
      pendingTasks,
    }),
    [caseCatalogsQuery.data?.caseTypes, mergedItems, pendingTasks],
  );
  const filterMaps = useMemo(() => buildFilterMaps(filterOptions), [filterOptions]);
  const pendingTaskIndex = useMemo(() => buildPendingTaskIndex(pendingTasks), [pendingTasks]);
  const taskMetaIndex = useMemo(() => buildTaskMetaIndex(pendingTasks), [pendingTasks]);
  const resolvedItems = useMemo(
    () => mergedItems.map((item) => ({
      ...item,
      panelPriorityState: resolveCasePriorityState(item, taskMetaIndex.get(String(item.id))),
    })),
    [mergedItems, taskMetaIndex],
  );
  const filteredItems = useMemo(
    () => applyLocalCaseFilters(resolvedItems, appliedFilters, { pendingTaskIndex }),
    [appliedFilters, resolvedItems, pendingTaskIndex],
  );
  const metricCounts = useMemo(() => buildMetricCounts(filteredItems, taskMetaIndex), [filteredItems, taskMetaIndex]);
  const activeChips = useMemo(() => buildFilterChips(appliedFilters, filterMaps), [appliedFilters, filterMaps]);
  const advancedFilterCount = useMemo(() => getAdvancedFilterCount(appliedFilters), [appliedFilters]);
  const prioritySummary = useMemo(() => filteredItems.reduce((accumulator, item) => {
    if (!item.panelPriorityState.isVisibleInPriority) {
      return accumulator;
    }

    if (item.panelPriorityState.priorityBucketCode === 'URGENT') {
      accumulator.urgent += 1;
    } else if (item.panelPriorityState.priorityBucketCode === 'ATTENTION') {
      accumulator.attention += 1;
    }

    return accumulator;
  }, { urgent: 0, attention: 0 }), [filteredItems]);
  const visibleItems = useMemo(() => {
    let nextItems = filteredItems;

    if (selectedView === 'priority') {
      nextItems = nextItems.filter((item) => item.panelPriorityState.isVisibleInPriority);
    } else if (selectedView === 'open') {
      nextItems = nextItems.filter((item) => getFolderStatusCode(item) === 'ABIERTA');
    } else {
      nextItems = nextItems.filter((item) => getFolderStatusCode(item) !== 'ABIERTA');
    }

    if (selectedMetric) {
      nextItems = nextItems.filter((item) => matchesMetric(item, selectedMetric, taskMetaIndex));
    }

    return sortVisibleItems(nextItems, selectedView);
  }, [filteredItems, selectedMetric, selectedView, taskMetaIndex]);
  const isRefreshing = panelQuery.isFetching || casesQuery.isFetching || tasksQuery.isFetching;
  const hasActiveFilters = activeChips.length > 0 || Boolean(selectedMetric);
  const hasManualFilters = activeChips.length > 0;

  const visibleItemsLabel = useMemo(() => {
    if (hasManualFilters) {
      return `${visibleItems.length} resultado${visibleItems.length === 1 ? '' : 's'}`;
    }

    if (selectedView === 'priority') {
      return `${visibleItems.length} caso${visibleItems.length === 1 ? '' : 's'} prioritario${visibleItems.length === 1 ? '' : 's'}`;
    }

    if (selectedView === 'open') {
      return `${visibleItems.length} caso${visibleItems.length === 1 ? '' : 's'} abierto${visibleItems.length === 1 ? '' : 's'}`;
    }

    return `${visibleItems.length} caso${visibleItems.length === 1 ? '' : 's'} cerrado${visibleItems.length === 1 ? '' : 's'}`;
  }, [hasManualFilters, selectedView, visibleItems.length]);

  if ((panelQuery.isLoading && !panelQuery.data) || (casesQuery.isLoading && !casesQuery.data)) {
    return <FullScreenLoader label="Cargando prioridades del taller..." compact />;
  }

  if (panelQuery.isError) {
    return <EmptyState title="No pude cargar el panel" description={panelQuery.error.message} />;
  }

  if (casesQuery.isError && !casesQuery.data) {
    return <EmptyState title="No pude cargar las carpetas del panel" description={casesQuery.error.message} />;
  }

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
      window.scrollTo(0, Math.max(nextTop, 0));
    }
  };

  const refreshPanel = async () => {
    await Promise.all([
      panelQuery.refetch(),
      casesQuery.refetch(),
      tasksQuery.refetch(),
    ]);
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
    scrollToResults();
  };

  const clearFilters = () => {
    setValidationMessage('');
    setDraftFilters(EMPTY_CASE_FILTERS);
    setAppliedFilters(EMPTY_CASE_FILTERS);
    setSelectedMetric('');
  };

  const handleRemoveChip = (key) => {
    const nextFilters = clearFilter(appliedFilters, key);
    setValidationMessage('');
    setAppliedFilters(nextFilters);
    setDraftFilters(nextFilters);
  };

  const handleMetricClick = (metricKey) => {
    setSelectedView(metricKey === 'openCases' ? 'open' : 'priority');
    setSelectedMetric((current) => (current === metricKey ? '' : metricKey));
    scrollToResults();
  };

  const renderEmptyState = () => {
    if (selectedView === 'priority' && !hasActiveFilters) {
      return (
        <div className="space-y-4">
          <EmptyState
            title="No hay urgencias pendientes"
            description="Cuando aparezcan pagos, turnos, prescripciones o tareas para revisar, los vas a ver en este panel."
          />
          <div className="flex justify-center">
            <Button type="button" variant="outline" onClick={() => navigate('/cases')}>
              Ver todas las carpetas
            </Button>
          </div>
        </div>
      );
    }

    if (hasActiveFilters) {
      return (
        <div className="space-y-4">
          <EmptyState
            title="No encontramos carpetas con estos filtros."
            description="Probá limpiar los filtros, cambiar la vista o revisar otra búsqueda para volver a ver resultados."
          />
          <div className="flex justify-center">
            <Button type="button" variant="outline" onClick={clearFilters}>Limpiar filtros</Button>
          </div>
        </div>
      );
    }

    return (
      <EmptyState
        title="No encontramos carpetas para esta vista"
        description="Probá revisar otra vista del panel general o abrir el listado completo de carpetas."
      />
    );
  };

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden border-white/60 bg-card/95 p-4 shadow-haze sm:p-6">
        <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.14),_transparent_48%),radial-gradient(circle_at_top_right,_rgba(14,116,144,0.14),_transparent_40%)]" />
        <div className="relative flex flex-col gap-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Panel general</p>
              <h2 className="text-3xl font-semibold tracking-tight text-foreground">Resumen del dia</h2>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Revisa prioridades, tareas pendientes y carpetas abiertas desde un unico tablero.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm text-muted-foreground">Última actualización: {formatDateTime(generatedAt)}</p>
              <Button type="button" size="sm" variant="outline" onClick={() => { void refreshPanel(); }} disabled={isRefreshing}>
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Actualizando...' : 'Actualizar'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-3 max-[339px]:grid-cols-1 md:grid-cols-2 xl:grid-cols-5">
            {METRIC_CARDS.map((metric) => {
              const Icon = metric.icon;
              const count = metricCounts[metric.key] ?? 0;
              const palette = count === 0 ? metricToneClassMap.neutral : metricToneClassMap[metric.tone];
              const isSelected = selectedMetric === metric.key;

              return (
                <button
                  key={metric.key}
                  type="button"
                  aria-pressed={isSelected}
                  className={[
                    'grid min-w-0 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 rounded-[20px] border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:rounded-[26px] sm:p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start',
                    metric.key === 'openCases' ? 'col-span-2 max-[339px]:col-span-1 md:col-span-1' : '',
                    isSelected ? palette.active : palette.idle,
                  ].join(' ')}
                  onClick={() => handleMetricClick(metric.key)}
                >
                  <div className="min-w-0 flex-1">
                    <div>
                      <p className="text-sm font-medium">{metric.label}</p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">{metric.helper}</p>
                    </div>
                  </div>
                  <Icon className={`h-5 w-5 shrink-0 ${palette.icon}`} />
                  <strong className={`text-2xl font-semibold tracking-tight ${palette.value} md:col-span-2 md:mt-5 md:text-3xl`}>{count}</strong>
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      <Card className="border-white/60 bg-card/95 p-4 shadow-haze sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Explorar carpetas</p>
            <h3 className="mt-2 text-xl font-semibold tracking-tight text-foreground">Busqueda y filtros</h3>
          </div>
        </div>

        <div className="mt-4 rounded-[24px] border border-border/70 bg-background/80 p-3.5 shadow-sm sm:p-4">
          <div className="grid gap-3 xl:grid-cols-[minmax(0,2fr)_repeat(3,minmax(170px,1fr))] xl:items-end">
            <FilterField label="Busqueda" className="xl:col-span-1">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  aria-label="Buscar por cliente, patente o carpeta"
                  className="pl-11"
                  placeholder="Buscar por cliente, patente o carpeta"
                  value={draftFilters.q}
                  onChange={(event) => updateDraftFilter('q', event.target.value)}
                />
              </div>
            </FilterField>

            <FilterField label="Estado de carpeta">
              <Select aria-label="Estado de carpeta" value={draftFilters.folderStatus} onChange={(event) => updateDraftFilter('folderStatus', event.target.value)}>
                <option value="">Todos</option>
                {filterOptions.folderStatuses.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </Select>
            </FilterField>

            <FilterField label="Estado del tramite">
              <Select aria-label="Estado del trámite" value={draftFilters.visibleTramiteState} onChange={(event) => updateDraftFilter('visibleTramiteState', event.target.value)}>
                <option value="">Todos</option>
                {filterOptions.visibleTramiteStates.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </Select>
            </FilterField>

            <FilterField label="Estado de reparacion">
              <Select aria-label="Estado de reparación" value={draftFilters.visibleRepairState} onChange={(event) => updateDraftFilter('visibleRepairState', event.target.value)}>
                <option value="">Todos</option>
                {filterOptions.visibleRepairStates.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </Select>
            </FilterField>
          </div>

          <div className="mt-3 flex flex-col gap-2.5 border-t border-border/60 pt-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="outline"
              className="inline-flex w-fit max-w-full items-center justify-center gap-2 self-start whitespace-nowrap px-4"
              onClick={() => setIsMoreFiltersOpen((current) => !current)}
              aria-expanded={isMoreFiltersOpen}
              aria-controls="panel-more-filters-panel"
            >
              <SlidersHorizontal className="h-4 w-4 shrink-0" />
              <span>{advancedFilterCount > 0 ? `Filtros avanzados · ${advancedFilterCount}` : 'Filtros avanzados'}</span>
              <ChevronDown className={`h-4 w-4 shrink-0 transition ${isMoreFiltersOpen ? 'rotate-180' : ''}`} />
            </Button>

            <div className="flex flex-wrap gap-2 sm:justify-end">
              <Button type="button" variant="outline" className="whitespace-nowrap" onClick={clearFilters} disabled={!hasActiveFilters && !Object.values(draftFilters).some(Boolean)}>
                Limpiar
              </Button>
              <Button type="button" className="whitespace-nowrap px-4" onClick={applyFilters}>
                Aplicar
              </Button>
            </div>
          </div>

          <div
            id="panel-more-filters-panel"
            className={`grid overflow-hidden transition-all duration-200 ${isMoreFiltersOpen ? 'mt-4 grid-rows-[1fr] border-t border-border/60 pt-4' : 'grid-rows-[0fr]'}`}
          >
            <div className="min-h-0">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <FilterField label="Tipo de tramite">
                  <Select aria-label="Tipo de trámite" value={draftFilters.caseTypeCode} onChange={(event) => updateDraftFilter('caseTypeCode', event.target.value)}>
                    <option value="">Todos</option>
                    {filterOptions.caseTypes.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </Select>
                </FilterField>

                <FilterField label="Estado de pago">
                  <Select aria-label="Estado de pago" value={draftFilters.paymentStateCode} onChange={(event) => updateDraftFilter('paymentStateCode', event.target.value)}>
                    <option value="">Todos</option>
                    {filterOptions.paymentStates.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </Select>
                </FilterField>

                <FilterField label="Sucursal">
                  <Select aria-label="Sucursal" value={draftFilters.branchId} onChange={(event) => updateDraftFilter('branchId', event.target.value)}>
                    <option value="">Todas</option>
                    {filterOptions.branches.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </Select>
                </FilterField>

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
                      <Input aria-label="Gestor" placeholder="Codigo exacto del gestor" value={draftFilters.managerCode} onChange={(event) => updateDraftFilter('managerCode', event.target.value)} />
                      <span className="text-xs text-muted-foreground">Todavia no hay nombres visibles para gestores; podés filtrar por codigo exacto.</span>
                    </>
                  )}
                </FilterField>

                <FilterField label="Tareas pendientes">
                  <Select aria-label="Tareas pendientes" value={draftFilters.hasPendingTasks} onChange={(event) => updateDraftFilter('hasPendingTasks', event.target.value)}>
                    <option value="">Todas</option>
                    <option value="true">Solo con tareas pendientes</option>
                    <option value="false">Solo sin tareas pendientes</option>
                  </Select>
                </FilterField>

                <FilterField label="Alta desde">
                  <Input aria-label="Alta desde" type="date" value={draftFilters.openedFrom} onChange={(event) => updateDraftFilter('openedFrom', event.target.value)} />
                </FilterField>

                <FilterField label="Alta hasta">
                  <Input aria-label="Alta hasta" type="date" value={draftFilters.openedTo} onChange={(event) => updateDraftFilter('openedTo', event.target.value)} />
                </FilterField>

                <FilterField label="Pago desde">
                  <Input aria-label="Pago desde" type="date" value={draftFilters.paidFrom} onChange={(event) => updateDraftFilter('paidFrom', event.target.value)} />
                </FilterField>

                <FilterField label="Pago hasta">
                  <Input aria-label="Pago hasta" type="date" value={draftFilters.paidTo} onChange={(event) => updateDraftFilter('paidTo', event.target.value)} />
                </FilterField>
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
          {selectedMetric ? (
            <button
              type="button"
              onClick={() => setSelectedMetric('')}
              className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition hover:bg-primary/15"
              aria-label={`Quitar filtro ${METRIC_CARDS.find((metric) => metric.key === selectedMetric)?.label || selectedMetric}`}
            >
              <span>{METRIC_CARDS.find((metric) => metric.key === selectedMetric)?.label || selectedMetric}</span>
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
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

      <Card className="border-white/60 bg-card/95 p-5 shadow-haze sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Vista del panel</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">Casos</h3>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge variant="outline">{visibleItemsLabel}</Badge>
              <Badge variant="destructive">Urgentes: {prioritySummary.urgent}</Badge>
              <Badge variant="secondary">Para atender: {prioritySummary.attention}</Badge>
              {tasksQuery.isError ? <Badge variant="outline">Tareas sin sincronizar</Badge> : null}
            </div>
          </div>

          <div className="max-w-full overflow-x-auto pb-1">
            <div className="flex w-max gap-2" role="tablist" aria-label="Vistas del panel general">
              {VIEW_OPTIONS.map((view) => (
                <button
                  key={view.id}
                  type="button"
                  role="tab"
                  aria-selected={selectedView === view.id}
                  className={[
                    'rounded-2xl border px-4 py-2 text-sm font-medium transition',
                    selectedView === view.id
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-border/70 bg-background/70 text-foreground hover:border-primary/40 hover:bg-primary/5',
                  ].join(' ')}
                  onClick={() => {
                    setSelectedView(view.id);
                    scrollToResults();
                  }}
                >
                  {view.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div ref={resultsRef} className="pt-1" aria-hidden="true" />

        {visibleItems.length === 0 ? (
          <div className="mt-6">{renderEmptyState()}</div>
        ) : (
          <>
            <Table
              containerClassName="mt-6 rounded-[22px] border-border/70 bg-muted/30 shadow-none md:rounded-[28px] md:bg-card md:shadow-haze"
              className="block w-full border-collapse text-sm md:table [&_thead]:hidden md:[&_thead]:table-header-group [&_tbody]:block md:[&_tbody]:table-row-group [&_tr]:block md:[&_tr]:table-row [&_tr]:border-b [&_tr]:border-border/50 [&_tr:last-child]:border-b-0"
            >
                <TableHeader>
                  <TableRow>
                    <TableHead>Prioridad</TableHead>
                    <TableHead>Carpeta</TableHead>
                    <TableHead>Estado del tramite</TableHead>
                    <TableHead>Estado de reparacion</TableHead>
                    <TableHead>Estado de pago</TableHead>
                    <TableHead>Motivos</TableHead>
                    <TableHead className="w-24" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleItems.map((item) => (
                    <TableRow key={item.id} className="hover:bg-transparent md:hover:bg-accent/30">
                      <TableCell className="hidden md:table-cell">
                        <CasePriorityBadge item={item} />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-foreground">{item.folderCode}</p>
                            <Badge variant="outline">{formatCodeLabel(item.caseTypeCode, 'Sin tipo')}</Badge>
                          </div>
                          <div className="space-y-1 text-sm">
                            <p className="font-medium text-foreground">{item.principalCustomerName || item.title || 'Cliente sin nombre'}</p>
                            <p className="text-muted-foreground">{item.principalVehiclePlate || 'Vehiculo sin informar'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <CaseTramiteBadge item={item} />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <CaseRepairBadge item={item} />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <CasePaymentBadge item={item} />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                          <div className="flex flex-wrap gap-1">
                            <CaseReasons item={item} pendingTaskCount={taskMetaIndex.get(String(item.id))?.count} />
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                          <Button type="button" size="sm" variant="outline" aria-label={`Abrir carpeta ${item.folderCode}`} onClick={() => navigate(`/cases/${item.id}`)}>
                          Abrir
                        </Button>
                      </TableCell>
                      <TableCell className="block p-0 md:hidden" colSpan={7}>
                        <article className="p-4 sm:p-5">
                          <div className="flex items-start gap-2">
                            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                              <p className="font-semibold text-foreground">{item.folderCode}</p>
                              <Badge variant="outline" className="max-w-full whitespace-normal break-words">
                                {formatCodeLabel(item.caseTypeCode, 'Sin tipo')}
                              </Badge>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <CasePriorityBadge item={item} />
                              <Button type="button" size="sm" variant="outline" className="h-10 w-auto px-3" aria-label={`Abrir carpeta ${item.folderCode}`} onClick={() => navigate(`/cases/${item.id}`)}>
                                Abrir
                              </Button>
                            </div>
                          </div>

                          <div className="mt-3 space-y-1 text-sm">
                            <p className="break-words font-medium text-foreground">{item.principalCustomerName || item.title || 'Cliente sin nombre'}</p>
                            <p className="break-words text-muted-foreground">{item.principalVehiclePlate || 'Vehiculo sin informar'}</p>
                          </div>

                          <div className="mt-3 grid grid-cols-3 gap-2">
                            <div className="min-w-0">
                              <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Tramite</span>
                              <div className="mt-1"><CaseTramiteBadge item={item} /></div>
                            </div>
                            <div className="min-w-0">
                              <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Reparacion</span>
                              <div className="mt-1"><CaseRepairBadge item={item} /></div>
                            </div>
                            <div className="min-w-0">
                              <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Pago</span>
                              <div className="mt-1"><CasePaymentBadge item={item} /></div>
                            </div>
                          </div>

                          {item.panelPriorityState.validReasons.length ? (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              <CaseReasons item={item} pendingTaskCount={taskMetaIndex.get(String(item.id))?.count} showEmpty={false} />
                            </div>
                          ) : null}
                        </article>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
          </>
        )}
      </Card>

      <Card className="border-white/60 bg-card/95 p-5 shadow-haze sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Acceso rapido</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">Listado completo</h3>
          </div>
          <Button type="button" onClick={() => navigate('/cases')}>
            Ver todas las carpetas
          </Button>
        </div>
      </Card>
    </div>
  );
};
