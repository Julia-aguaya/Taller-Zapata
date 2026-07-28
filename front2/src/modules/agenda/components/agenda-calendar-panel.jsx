import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { SectionCard } from '@/shared/ui/section-card';
import { formatMonthLabel } from '@/modules/agenda/lib/agenda-helpers';

const WEEK_DAYS = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

const getCellClasses = (cell, isSelected) => [
  'group flex min-h-[84px] flex-col rounded-2xl border px-2 py-2 text-left transition sm:min-h-[96px] md:min-h-[136px] md:px-3 md:py-3',
  cell.inCurrentMonth ? 'bg-card' : 'bg-background/55 text-muted-foreground',
  cell.isWeekend ? 'border-primary/10 bg-primary/[0.02]' : 'border-border/70',
  cell.isToday ? 'shadow-[inset_0_0_0_1px_rgba(37,99,235,0.15)]' : '',
  isSelected ? 'border-primary bg-primary/[0.07] shadow-[0_0_0_1px_rgba(37,99,235,0.16)]' : 'hover:border-primary/35 hover:bg-background',
].join(' ');

export const AgendaCalendarPanel = ({
  calendarCells,
  selectedDate,
  visibleMonth,
  onSelectDate,
  onPreviousMonth,
  onNextMonth,
  onToday,
}) => (
  <SectionCard className="p-4 sm:p-5 lg:p-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Calendario mensual</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{formatMonthLabel(visibleMonth)}</h2>
      </div>

      <div className="flex items-center gap-2 self-start sm:self-auto">
        <Button type="button" size="sm" variant="outline" onClick={onPreviousMonth} aria-label="Mes anterior">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onToday}>Hoy</Button>
        <Button type="button" size="sm" variant="outline" onClick={onNextMonth} aria-label="Mes siguiente">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>

    <div className="mt-4 grid grid-cols-7 gap-1.5 text-center text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground md:gap-2">
      {WEEK_DAYS.map((day) => <span key={day}>{day}</span>)}
    </div>

    <div className="mt-2 grid grid-cols-7 gap-1.5 md:gap-2">
      {calendarCells.map((cell) => {
        const isSelected = selectedDate === cell.iso;

        return (
          <button
            key={cell.iso}
            type="button"
            onClick={() => onSelectDate(cell.iso)}
            className={getCellClasses(cell, isSelected)}
            aria-pressed={isSelected}
            aria-label={`${cell.iso} con ${cell.tasks.length} tareas`}
          >
            <div className="flex items-start justify-between gap-1">
              <span className={`text-sm font-semibold ${cell.isToday ? 'text-primary' : 'text-foreground'} md:text-base`}>
                {cell.date.getDate()}
              </span>
              {cell.tasks.length > 0 ? (
                <Badge variant={cell.tone} className="px-2 py-0.5 text-[10px] md:text-[11px]">
                  {cell.tasks.length}
                </Badge>
              ) : null}
            </div>

            <div className="mt-2 flex min-h-0 flex-1 flex-col gap-1 overflow-hidden">
              <div className="flex items-center gap-1 md:hidden">
                {cell.tasks.slice(0, 3).map((task) => (
                  <span
                    key={task.id}
                    className={`h-1.5 w-1.5 rounded-full ${task.bucket === 'OVERDUE' ? 'bg-destructive' : task.bucket === 'IN_PROGRESS' ? 'bg-primary' : task.bucket === 'RESOLVED' ? 'bg-success' : 'bg-secondary-foreground/60'}`}
                  />
                ))}
                {cell.tasks.length > 3 ? <span className="text-[10px] text-muted-foreground">+{cell.tasks.length - 3}</span> : null}
              </div>

              <div className="hidden min-h-0 flex-1 space-y-1.5 md:block">
                {cell.tasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    className={`rounded-xl border px-2 py-1 text-left ${task.bucket === 'OVERDUE' ? 'border-destructive/20 bg-destructive/5' : 'border-border/60 bg-background/75'}`}
                  >
                    <p className="truncate text-[11px] font-medium text-foreground">{task.caseItem?.folderCode || task.title || 'Tarea'}</p>
                    <p className="truncate text-[10px] text-muted-foreground">{task.title || 'Sin titulo'}</p>
                  </div>
                ))}
                {cell.tasks.length > 3 ? <p className="text-[11px] text-muted-foreground">+{cell.tasks.length - 3} mas</p> : null}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  </SectionCard>
);
