import { RefreshCw, Search, X } from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { SectionCard } from '@/shared/ui/section-card';
import { Select } from '@/shared/ui/select';

const BUCKET_FILTER_LABELS = {
  CANCELLED: 'Canceladas',
  PENDING: 'Pendientes',
  IN_PROGRESS: 'En curso',
  OVERDUE: 'Vencidas',
  RESOLVED: 'Resueltas',
};

const ASSIGNEE_FILTER_LABELS = {
  MINE: 'Mi usuario',
  ASSIGNED: 'Con responsable',
  UNASSIGNED: 'Sin responsable',
};

export const AgendaFiltersToolbar = ({
  search,
  onSearchChange,
  bucketFilter,
  onBucketFilterChange,
  assigneeFilter,
  onAssigneeFilterChange,
  onClearFilters,
  onRefresh,
  filteredCount,
}) => {
  const normalizedSearch = search.trim();
  const activeFilters = [
    bucketFilter !== 'ALL'
      ? {
          key: 'bucket',
          label: `Estado: ${BUCKET_FILTER_LABELS[bucketFilter] || bucketFilter}`,
          onRemove: () => onBucketFilterChange('ALL'),
        }
      : null,
    assigneeFilter !== 'ALL'
      ? {
          key: 'assignee',
          label: `Responsable: ${ASSIGNEE_FILTER_LABELS[assigneeFilter] || assigneeFilter}`,
          onRemove: () => onAssigneeFilterChange('ALL'),
        }
      : null,
    normalizedSearch
      ? {
          key: 'search',
          label: `Busqueda: ${normalizedSearch}`,
          onRemove: () => onSearchChange(''),
        }
      : null,
  ].filter(Boolean);

  const hasActiveFilters = activeFilters.length > 0;

  return (
    <SectionCard className="p-4 sm:p-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar por carpeta, cliente, patente, responsable o tarea"
            className="pl-11"
            aria-label="Buscar tareas"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,180px)_minmax(0,190px)_auto_auto] xl:items-center">
          <Select value={bucketFilter} onChange={(event) => onBucketFilterChange(event.target.value)} aria-label="Filtrar por estado">
            <option value="ALL">Todos los estados</option>
            <option value="CANCELLED">Canceladas</option>
            <option value="PENDING">Pendientes</option>
            <option value="IN_PROGRESS">En curso</option>
            <option value="OVERDUE">Vencidas</option>
            <option value="RESOLVED">Resueltas</option>
          </Select>

          <Select value={assigneeFilter} onChange={(event) => onAssigneeFilterChange(event.target.value)} aria-label="Filtrar por responsable">
            <option value="ALL">Todos los responsables</option>
            <option value="MINE">Mi usuario</option>
            <option value="ASSIGNED">Con responsable</option>
            <option value="UNASSIGNED">Sin responsable</option>
          </Select>

          <Button type="button" variant="outline" onClick={onClearFilters} disabled={!hasActiveFilters}>
            <X className="mr-2 h-4 w-4" />
            Limpiar filtros
          </Button>

          <Button type="button" variant="ghost" size="sm" onClick={onRefresh} className="justify-center xl:justify-self-end">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refrescar
          </Button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="outline">{filteredCount} resultados</Badge>

        {hasActiveFilters ? (
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            {activeFilters.map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={filter.onRemove}
                className="inline-flex max-w-full items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-1.5 text-left text-xs font-medium text-foreground transition hover:border-primary/40 hover:text-primary"
                aria-label={`Quitar filtro ${filter.label}`}
              >
                <span className="truncate">{filter.label}</span>
                <X className="h-3.5 w-3.5 shrink-0" />
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </SectionCard>
  );
};
