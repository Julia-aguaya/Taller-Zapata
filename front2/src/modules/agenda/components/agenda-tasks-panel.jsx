import { CalendarClock, FolderOpen, UserCircle2 } from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { SectionCard } from '@/shared/ui/section-card';
import { Select } from '@/shared/ui/select';
import { SurfacePanel } from '@/shared/ui/surface-panel';
import {
  DEFAULT_TASK_PRIORITY,
  OPEN_TASK_FALLBACK_STATUS,
  formatDate,
  formatTaskDueDate,
  getTaskBucketMeta,
  getTaskDisplayStatus,
  getTaskDueVariant,
  getTaskPriorityVariant,
  getTaskScopeLabel,
  getTaskStatusVariant,
  isCancelledTaskStatus,
  isResolvedTaskStatus,
  normalizeTaskStatusCode,
} from '@/modules/agenda/lib/agenda-helpers';

const TasksEmptyState = ({ hasError, message, hasNextDate, onJumpToNextDate, mode, emptyMessage }) => {
  if (hasError) {
    return (
      <SurfacePanel tone="danger" radius="lg" padding="md" className="mt-4 text-sm text-destructive">
        No pude cargar `/tasks`: {message}
      </SurfacePanel>
    );
  }

  return (
    <SurfacePanel tone="soft" radius="lg" padding="lg" borderStyle="dashed" className="mt-4 text-center text-sm">
      <p>{emptyMessage}</p>
      {mode !== 'UPCOMING' && hasNextDate ? (
        <Button type="button" size="sm" variant="outline" onClick={onJumpToNextDate} className="mt-4">
          Ver proximas tareas
        </Button>
      ) : null}
    </SurfacePanel>
  );
};

export const AgendaTasksPanel = ({
  sectionRef,
  tasks,
  title,
  panelLabel,
  mode,
  emptyMessage,
  hasError,
  errorMessage,
  taskStatusOptions,
  onToggleResolved,
  onStatusChange,
  mutationPending,
  onOpenCase,
  hasNextDate,
  onJumpToNextDate,
  isHighlighted,
}) => (
  <div
    ref={sectionRef}
    tabIndex={-1}
    role="region"
    aria-labelledby="agenda-tasks-heading"
    className="scroll-mt-24 outline-none sm:scroll-mt-28"
  >
    <SectionCard className={[
      'p-4 transition-[background-color,box-shadow,border-color] duration-500 sm:p-5 lg:p-6',
      isHighlighted ? 'border-primary/30 bg-primary/[0.03] shadow-[0_0_0_1px_rgba(37,99,235,0.14)]' : '',
    ].join(' ')}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{panelLabel}</p>
          <h2 id="agenda-tasks-heading" className="mt-1 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {title}
          </h2>
        </div>
        <Badge variant="outline" className="self-start">{tasks.length}</Badge>
      </div>

      {hasError || tasks.length === 0 ? (
          <TasksEmptyState
            hasError={hasError}
            message={errorMessage}
            mode={mode}
            emptyMessage={emptyMessage}
            hasNextDate={hasNextDate}
            onJumpToNextDate={onJumpToNextDate}
          />
      ) : (
        <div className="mt-4 space-y-3">
          {tasks.map((task) => {
            const isResolved = isResolvedTaskStatus(task.statusCode);
            const isCancelled = isCancelledTaskStatus(task.statusCode);
            const caseItem = task.caseItem;
            const displayStatus = getTaskDisplayStatus(task);
            const bucketMeta = getTaskBucketMeta(displayStatus.bucket);
            const hasCurrentStatusOption = taskStatusOptions.some((option) => normalizeTaskStatusCode(option.value) === normalizeTaskStatusCode(task.statusCode));
            const statusOptions = hasCurrentStatusOption || !task.statusCode
              ? taskStatusOptions
              : [{ value: task.statusCode, label: task.statusLabel }, ...taskStatusOptions];

            return (
              <SurfacePanel
                key={task.id}
                tone="muted"
                radius="lg"
                padding="md"
                className={[
                  'overflow-hidden border-border/70 transition',
                  displayStatus.bucket === 'OVERDUE' ? 'border-destructive/25 bg-destructive/[0.04]' : '',
                  isCancelled ? 'border-border/60 bg-muted/40 opacity-75' : '',
                  isResolved && !isCancelled ? 'opacity-70' : '',
                ].join(' ')}
              >
                <div className="flex flex-col gap-4 xl:grid xl:grid-cols-[minmax(0,1.3fr)_minmax(220px,0.7fr)_auto] xl:items-start">
                  <div className="min-w-0 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-foreground sm:text-base">{task.title || 'Tarea sin titulo'}</p>
                      <Badge variant={getTaskStatusVariant(task.statusCode)}>{task.statusLabel}</Badge>
                      <Badge variant={bucketMeta.variant}>{bucketMeta.label}</Badge>
                      <Badge variant={getTaskPriorityVariant(task.priorityCode)}>{task.priorityCode || DEFAULT_TASK_PRIORITY}</Badge>
                    </div>

                    {task.description ? <p className="text-sm leading-6 text-muted-foreground">{task.description}</p> : null}

                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {caseItem?.folderCode ? <span className="rounded-full border border-border/70 px-2.5 py-1">{caseItem.folderCode}</span> : null}
                      {caseItem?.principalCustomerName ? <span className="rounded-full border border-border/70 px-2.5 py-1">{caseItem.principalCustomerName}</span> : null}
                      {caseItem?.principalVehiclePlate ? <span className="rounded-full border border-border/70 px-2.5 py-1">{caseItem.principalVehiclePlate}</span> : null}
                      <span className="rounded-full border border-border/70 px-2.5 py-1">{getTaskScopeLabel(task)}</span>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                    <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
                      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        <CalendarClock className="h-3.5 w-3.5 text-primary" />
                        <span>Vencimiento</span>
                      </div>
                      <p className="mt-2 text-sm font-medium text-foreground">{formatTaskDueDate(task)}</p>
                      <Badge variant={getTaskDueVariant(task)} className="mt-2">{task.dueDate ? formatDate(task.dueDate) : 'Sin fecha'}</Badge>
                    </div>

                    <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
                      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        <UserCircle2 className="h-3.5 w-3.5 text-primary" />
                        <span>Responsable</span>
                      </div>
                      <p className="mt-2 text-sm font-medium text-foreground">{task.assigneeLabel}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 xl:w-[220px]">
                    <Select
                      value={task.statusCode || OPEN_TASK_FALLBACK_STATUS}
                      onChange={(event) => onStatusChange(task, event.target.value)}
                      disabled={mutationPending}
                      className="h-11"
                      aria-label={`Cambiar estado de ${task.title || 'tarea'}`}
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </Select>

                    {isCancelled ? null : (
                      <Button
                        type="button"
                        variant={isResolved ? 'outline' : 'default'}
                        size="sm"
                        onClick={() => onToggleResolved(task)}
                        disabled={mutationPending}
                      >
                        {isResolved ? 'Reabrir tarea' : 'Marcar resuelta'}
                      </Button>
                    )}

                    {caseItem ? (
                      <Button type="button" size="sm" variant="ghost" onClick={() => onOpenCase(caseItem.id)}>
                        <FolderOpen className="mr-2 h-4 w-4" />
                        Ir a la carpeta
                      </Button>
                    ) : null}
                  </div>
                </div>
              </SurfacePanel>
            );
          })}
        </div>
      )}
    </SectionCard>
  </div>
);
