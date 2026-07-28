import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { listOperationalTasks, updateOperationalTask } from '@/modules/agenda/api/agenda-api';
import { useSession } from '@/modules/auth/providers/session-provider';
import { listCases } from '@/modules/cases/api/cases-api';
import { getOperationCatalogs } from '@/modules/cases/api/operations-api';
import { EmptyState } from '@/shared/ui/empty-state';
import { FullScreenLoader } from '@/shared/ui/full-screen-loader';
import { AgendaCalendarPanel } from '@/modules/agenda/components/agenda-calendar-panel';
import { AgendaFiltersToolbar } from '@/modules/agenda/components/agenda-filters-toolbar';
import { AgendaHeader } from '@/modules/agenda/components/agenda-header';
import { AgendaTasksPanel } from '@/modules/agenda/components/agenda-tasks-panel';
import {
  DEFAULT_TASK_PRIORITY,
  OPEN_TASK_FALLBACK_STATUS,
  RESOLVED_TASK_STATUS,
  TODAY,
  buildCalendarCells,
  formatSelectedDateLabel,
  getTaskAssigneeLabel,
  getTaskDisplayStatus,
  getTaskStatusLabel,
  getMonthKey,
  getTaskScopeLabel,
  isCancelledTaskStatus,
  isResolvedTaskStatus,
  matchesSearch,
  normalizeTaskDate,
  sortTasksByDueDate,
  sortTasksByUrgency,
  shiftMonth,
} from '@/modules/agenda/lib/agenda-helpers';

const BUCKET_TITLES = {
  CANCELLED: 'Tareas canceladas',
  PENDING: 'Tareas pendientes',
  IN_PROGRESS: 'Tareas en curso',
  OVERDUE: 'Tareas vencidas',
  RESOLVED: 'Tareas resueltas',
};

const DEFAULT_TASK_STATUS_OPTIONS = [
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'EN_PROCESO', label: 'En curso' },
  { value: RESOLVED_TASK_STATUS, label: 'Resuelta' },
];

const matchesAssigneeFilter = (task, assigneeFilter, userId) => {
  if (assigneeFilter === 'MINE') return Number(task.assignedUserId || 0) === userId;
  if (assigneeFilter === 'ASSIGNED') return Boolean(task.assignedUserId);
  if (assigneeFilter === 'UNASSIGNED') return !task.assignedUserId;
  return true;
};

const matchesBucketFilter = (task, bucketFilter) => bucketFilter === 'ALL' || task.bucket === bucketFilter;

const getTaskUpdatePayload = (task, statusCode) => ({
  originModuleCode: task.originModuleCode || 'OPERACION',
  originSubtabCode: task.originSubtabCode || 'AGENDA',
  title: task.title,
  description: task.description || null,
  dueDate: task.dueDate || null,
  priorityCode: task.priorityCode || DEFAULT_TASK_PRIORITY,
  statusCode,
  assignedUserId: task.assignedUserId || null,
  payload: task.payload || null,
});

export const AgendaPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session } = useSession();
  const [search, setSearch] = useState('');
  const [bucketFilter, setBucketFilter] = useState('ALL');
  const [assigneeFilter, setAssigneeFilter] = useState('ALL');
  const [selectedDate, setSelectedDate] = useState(null);
  const [visibleMonth, setVisibleMonth] = useState(TODAY);
  const [tasksPanelMode, setTasksPanelMode] = useState('SELECTED_DAY');
  const [tasksPanelHighlight, setTasksPanelHighlight] = useState(false);
  const [scrollRequestToken, setScrollRequestToken] = useState(0);
  const tasksPanelRef = useRef(null);
  const pendingScrollTokenRef = useRef(null);
  const highlightTimeoutRef = useRef(null);
  const hasLoadedTasksRef = useRef(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [allTasks, setAllTasks] = useState([]);

  const userId = Number(session?.user?.id || 0);
  const defaultScope = session?.scopes?.[0] ?? null;

  const casesQuery = useQuery({
    queryKey: ['cases', 'list', 'agenda', defaultScope?.branchId || 'all'],
    queryFn: () => listCases({ size: 200, branchId: defaultScope?.branchId || undefined }),
  });

  const tasksQuery = useQuery({
    queryKey: ['agenda', 'tasks', defaultScope?.organizationId || 'all', defaultScope?.branchId || 'all'],
    queryFn: () => listOperationalTasks({
      size: 200,
      organizationId: defaultScope?.organizationId || undefined,
      branchId: defaultScope?.branchId || undefined,
    }),
  });

  const catalogsQuery = useQuery({
    queryKey: ['operation', 'catalogs'],
    queryFn: getOperationCatalogs,
  });

  const cases = casesQuery.data?.items ?? [];

  const casesIndex = useMemo(
    () => new Map(cases.map((item) => [item.id, item])),
    [cases],
  );

  const taskStatusOptions = useMemo(() => {
    const catalogOptions = (catalogsQuery.data?.taskStatusCodes ?? []).map((item) => ({
      value: item.code,
      label: item.name,
    }));
    return catalogOptions.length > 0 ? catalogOptions : DEFAULT_TASK_STATUS_OPTIONS;
  }, [catalogsQuery.data?.taskStatusCodes]);

  const openTaskStatusCode = useMemo(() => {
    const firstNonResolved = taskStatusOptions.find((item) => !isResolvedTaskStatus(item.value) && !isCancelledTaskStatus(item.value));
    return firstNonResolved?.value || OPEN_TASK_FALLBACK_STATUS;
  }, [taskStatusOptions]);

  const fetchedTasks = useMemo(() => sortTasksByUrgency((tasksQuery.data?.items ?? []).map((task) => {
    const caseItem = task.caseId ? casesIndex.get(task.caseId) : null;
    const dueDate = normalizeTaskDate(task.dueDate);
    const displayStatus = getTaskDisplayStatus({ ...task, dueDate });

    return {
      ...task,
      dueDate,
      caseItem,
      bucket: displayStatus.bucket,
      displayStatus,
      assigneeLabel: getTaskAssigneeLabel(task, userId),
      statusLabel: getTaskStatusLabel(task.statusCode, taskStatusOptions),
      scopeLabel: getTaskScopeLabel(task),
    };
  })), [casesIndex, taskStatusOptions, tasksQuery.data?.items, userId]);

  useEffect(() => {
    if (!tasksQuery.isSuccess) return;

    if (fetchedTasks.length > 0 || !hasLoadedTasksRef.current) {
      setAllTasks(fetchedTasks);
      hasLoadedTasksRef.current = true;
    }
  }, [fetchedTasks, tasksQuery.isSuccess]);

  const filteredTasks = useMemo(() => allTasks.filter((task) => {
    if (!matchesAssigneeFilter(task, assigneeFilter, userId)) return false;

    return matchesSearch(search, [
      task.title,
      task.description,
      task.priorityCode,
      task.statusCode,
      task.statusLabel,
      task.scopeLabel,
      task.assigneeLabel,
      task.caseItem?.folderCode,
      task.caseItem?.principalCustomerName,
      task.caseItem?.principalVehiclePlate,
      task.caseItem?.caseTypeCode,
    ]);
  }), [allTasks, assigneeFilter, bucketFilter, search, userId]);

  const metrics = useMemo(() => allTasks.reduce((acc, task) => {
    if (task.bucket === 'CANCELLED') acc.cancelled += 1;
    else if (task.bucket === 'OVERDUE') acc.overdue += 1;
    else if (task.bucket === 'IN_PROGRESS') acc.inProgress += 1;
    else if (task.bucket === 'RESOLVED') acc.resolved += 1;
    else acc.pending += 1;
    return acc;
  }, {
    cancelled: 0,
    pending: 0,
    inProgress: 0,
    overdue: 0,
    resolved: 0,
  }), [allTasks]);

  const activeTasks = useMemo(
    () => sortTasksByDueDate(filteredTasks.filter((task) => task.displayStatus.isActive)),
    [filteredTasks],
  );

  const upcomingTasks = useMemo(() => activeTasks
    .filter((task) => task.dueDate)
    .sort((left, right) => (left.dueDate || '9999-12-31').localeCompare(right.dueDate || '9999-12-31'))
    .slice(0, 6), [activeTasks]);

  const visibleMonthKey = useMemo(() => getMonthKey(visibleMonth), [visibleMonth]);

  const calendarTasks = useMemo(
    () => allTasks.filter((task) => task.dueDate && getMonthKey(task.dueDate) === visibleMonthKey && task.displayStatus.isVisibleInCalendar),
    [allTasks, visibleMonthKey],
  );

  const calendarCells = useMemo(
    () => buildCalendarCells(calendarTasks, visibleMonth),
    [calendarTasks, visibleMonth],
  );

  const listTasks = useMemo(
    () => {
      if (selectedDate) {
        return sortTasksByDueDate(filteredTasks.filter((task) => normalizeTaskDate(task.dueDate) === selectedDate && task.displayStatus.isVisibleInCalendar));
      }

      if (bucketFilter !== 'ALL') {
        return sortTasksByDueDate(filteredTasks.filter((task) => matchesBucketFilter(task, bucketFilter)));
      }

      return activeTasks;
    },
    [activeTasks, bucketFilter, filteredTasks, selectedDate],
  );

  const tasksPanelTasks = tasksPanelMode === 'UPCOMING' ? upcomingTasks : listTasks;
  const tasksPanelTitle = tasksPanelMode === 'UPCOMING'
    ? 'Proximas tareas'
    : selectedDate
      ? `Tareas del ${formatSelectedDateLabel(selectedDate)}`
      : bucketFilter !== 'ALL'
        ? BUCKET_TITLES[bucketFilter] || 'Tareas filtradas'
      : 'Tareas activas';

  const tasksPanelLabel = tasksPanelMode === 'UPCOMING'
    ? 'Bandeja de seguimiento'
    : selectedDate
      ? 'Bandeja diaria'
      : bucketFilter !== 'ALL'
        ? 'Bandeja por estado'
        : 'Bandeja activa';

  const tasksPanelEmptyMessage = tasksPanelMode === 'UPCOMING'
    ? 'No hay proximas tareas.'
    : selectedDate
      ? selectedDate === TODAY()
        ? 'No hay tareas para hoy.'
        : 'No hay tareas para este dia.'
      : bucketFilter === 'CANCELLED'
        ? 'No hay tareas canceladas.'
        : bucketFilter !== 'ALL'
          ? 'No hay tareas para este estado.'
          : 'No hay tareas activas.';

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event) => setPrefersReducedMotion(event.matches);
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  useEffect(() => {
    if (pendingScrollTokenRef.current == null || pendingScrollTokenRef.current !== scrollRequestToken) return undefined;
    if (typeof window === 'undefined') return undefined;

    const panel = tasksPanelRef.current;
    if (!panel) return undefined;

    let frameId = window.requestAnimationFrame(() => {
      frameId = window.requestAnimationFrame(() => {
        panel.scrollIntoView({
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
          block: 'start',
        });
        panel.focus({ preventScroll: true });
        setTasksPanelHighlight(true);
        pendingScrollTokenRef.current = null;

        if (highlightTimeoutRef.current) window.clearTimeout(highlightTimeoutRef.current);
        highlightTimeoutRef.current = window.setTimeout(() => setTasksPanelHighlight(false), 1800);
      });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [prefersReducedMotion, scrollRequestToken]);

  useEffect(() => () => {
    if (highlightTimeoutRef.current) window.clearTimeout(highlightTimeoutRef.current);
  }, []);

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, payload }) => updateOperationalTask(taskId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['agenda', 'tasks'] });
      toast.success('Tarea actualizada.');
    },
    onError: (error) => toast.error(error.message || 'No pude actualizar la tarea.'),
  });

  if (casesQuery.isLoading || tasksQuery.isLoading) {
    return <FullScreenLoader label="Armando agenda de tareas..." compact />;
  }

  if (casesQuery.isError) {
    return <EmptyState title="No pude cargar la agenda" description={casesQuery.error.message} />;
  }

  const handleOpenCase = (caseId) => navigate(`/cases/${caseId}`);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['cases'] });
    queryClient.invalidateQueries({ queryKey: ['agenda', 'tasks'] });
  };

  const handleClearFilters = () => {
    setSearch('');
    setBucketFilter('ALL');
    setAssigneeFilter('ALL');
    setSelectedDate(null);
    setTasksPanelMode('SELECTED_DAY');
  };

  const handleSelectDate = (iso) => {
    pendingScrollTokenRef.current = scrollRequestToken + 1;
    setSelectedDate((current) => (current === iso ? null : iso));
    setBucketFilter('ALL');
    setVisibleMonth(iso);
    setTasksPanelMode('SELECTED_DAY');
    setScrollRequestToken((current) => current + 1);
  };

  const handleToday = () => {
    const today = TODAY();
    setSelectedDate(today);
    setBucketFilter('ALL');
    setVisibleMonth(today);
    setTasksPanelMode('SELECTED_DAY');
  };

  const handleBucketFilterChange = (nextBucketFilter) => {
    pendingScrollTokenRef.current = scrollRequestToken + 1;
    setSelectedDate(null);
    setBucketFilter(nextBucketFilter);
    setTasksPanelMode('SELECTED_DAY');
    setScrollRequestToken((current) => current + 1);
  };

  const handleShowUpcomingTasks = () => {
    if (upcomingTasks.length === 0) return;
    setTasksPanelMode('UPCOMING');
  };

  const handleStatusChange = (task, statusCode) => {
    updateTaskMutation.mutate({
      taskId: task.id,
      payload: getTaskUpdatePayload(task, statusCode),
    });
  };

  const handleToggleResolved = (task) => {
    handleStatusChange(task, isResolvedTaskStatus(task.statusCode) ? openTaskStatusCode : RESOLVED_TASK_STATUS);
  };

  return (
    <div className="space-y-5">
      <AgendaHeader
        metrics={metrics}
        bucketFilter={bucketFilter}
        onBucketFilterChange={handleBucketFilterChange}
      />

      <AgendaCalendarPanel
        calendarCells={calendarCells}
        selectedDate={selectedDate}
        visibleMonth={visibleMonth}
        onSelectDate={handleSelectDate}
        onPreviousMonth={() => setVisibleMonth((current) => shiftMonth(current, -1))}
        onNextMonth={() => setVisibleMonth((current) => shiftMonth(current, 1))}
        onToday={handleToday}
      />

      <AgendaFiltersToolbar
        search={search}
        onSearchChange={setSearch}
        bucketFilter={bucketFilter}
        onBucketFilterChange={handleBucketFilterChange}
        assigneeFilter={assigneeFilter}
        onAssigneeFilterChange={setAssigneeFilter}
        onClearFilters={handleClearFilters}
        onRefresh={handleRefresh}
        filteredCount={tasksPanelTasks.length}
      />

      <AgendaTasksPanel
        sectionRef={tasksPanelRef}
        tasks={tasksPanelTasks}
        title={tasksPanelTitle}
        panelLabel={tasksPanelLabel}
        emptyMessage={tasksPanelEmptyMessage}
        mode={tasksPanelMode}
        hasError={tasksQuery.isError}
        errorMessage={tasksQuery.error?.message}
        taskStatusOptions={taskStatusOptions}
        onToggleResolved={handleToggleResolved}
        onStatusChange={handleStatusChange}
        mutationPending={updateTaskMutation.isPending}
        onOpenCase={handleOpenCase}
        hasNextDate={upcomingTasks.length > 0}
        onJumpToNextDate={handleShowUpcomingTasks}
        isHighlighted={tasksPanelHighlight}
      />
    </div>
  );
};
