import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { SectionCard } from '@/shared/ui/section-card';

const SUMMARY_CHIPS = [
  { key: 'cancelled', bucket: 'CANCELLED', label: 'Canceladas', variant: 'outline' },
  { key: 'pending', bucket: 'PENDING', label: 'Pendientes', variant: 'secondary' },
  { key: 'inProgress', bucket: 'IN_PROGRESS', label: 'En curso', variant: 'default' },
  { key: 'overdue', bucket: 'OVERDUE', label: 'Vencidas', variant: 'destructive' },
  { key: 'resolved', bucket: 'RESOLVED', label: 'Resueltas', variant: 'success' },
];

export const AgendaHeader = ({ metrics, bucketFilter, onBucketFilterChange, canCreateTask = false, onCreateTask }) => (
  <SectionCard className="p-5 sm:p-6">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Agenda</h1>
        <p className="text-sm text-muted-foreground">Organiza y segui las tareas del taller</p>
      </div>

      {canCreateTask ? (
        <Button onClick={onCreateTask}>Nueva tarea</Button>
      ) : null}
    </div>

    <div className="mt-4 flex flex-wrap gap-2">
      {SUMMARY_CHIPS.map((chip) => {
        const isActive = bucketFilter === chip.bucket;

        return (
          <Button
            key={chip.key}
            type="button"
            variant={isActive ? chip.variant : 'outline'}
            size="sm"
            onClick={() => onBucketFilterChange(isActive ? 'ALL' : chip.bucket)}
            className="h-10 rounded-full px-4"
            aria-pressed={isActive}
          >
            <span>{chip.label}</span>
            <Badge variant={isActive ? 'outline' : chip.variant} className="ml-2 px-2 py-0.5 text-[11px]">
              {metrics[chip.key]}
            </Badge>
          </Button>
        );
      })}
    </div>
  </SectionCard>
);
