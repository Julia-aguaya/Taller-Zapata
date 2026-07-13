import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CalendarClock, CircleDollarSign, Clock3, FolderOpen } from 'lucide-react';
import { getPanelGeneral } from '@/modules/panel/api/panel-api';
import { Card } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { EmptyState } from '@/shared/ui/empty-state';
import { FullScreenLoader } from '@/shared/ui/full-screen-loader';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/ui/table';

const summaryCards = [
  { key: 'openCases', label: 'Casos abiertos', icon: Clock3 },
  { key: 'pendingPayments', label: 'Pagos pendientes', icon: CircleDollarSign },
  { key: 'casesWithoutAppointment', label: 'Pendientes de turno', icon: CalendarClock },
  { key: 'casesNearPrescription', label: 'Proximos a prescribir', icon: AlertTriangle },
];

export const PanelPage = () => {
  const navigate = useNavigate();
  const panelQuery = useQuery({
    queryKey: ['panel', 'general'],
    queryFn: getPanelGeneral,
  });

  if (panelQuery.isLoading) {
    return <FullScreenLoader label="Cargando prioridades del taller..." compact />;
  }

  if (panelQuery.isError) {
    return <EmptyState title="No pude cargar el panel" description={panelQuery.error.message} />;
  }

  const { summary, priorityBuckets, generatedAt } = panelQuery.data;
  const allItems = priorityBuckets.flatMap((bucket) => bucket.items);

  return (
    <div className="space-y-5">
      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="border-white/50 bg-card/90 p-6 shadow-haze">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Panel general</p>
              <h3 className="mt-2 text-3xl font-semibold tracking-tight">Prioridades y urgencias del dia</h3>
            </div>
            <Badge variant="outline">Generado {new Date(generatedAt).toLocaleString('es-AR')}</Badge>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.key} className="rounded-3xl border border-border/70 bg-background/80 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{item.label}</p>
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <p className="mt-4 text-3xl font-semibold tracking-tight">{summary[item.key]}</p>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="border-warning/40 bg-warning/10 p-6 shadow-haze">
          <p className="text-xs uppercase tracking-[0.24em] text-warning-foreground/70">Criterio de prioridad</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-warning-foreground">El backend ya ordena el trabajo.</h3>
          <p className="mt-3 text-sm text-warning-foreground/80">
            Este panel no decide con heurísticas del navegador. Consume `panel/general` y respeta estados visibles, fechas de prescripción y tareas pendientes.
          </p>
        </Card>
      </section>

      <section>
        {allItems.length === 0 ? (
          <EmptyState title="Sin alertas operativas" description="Cuando aparezcan pagos pendientes, casos sin turno o próximos a prescribir, van a caer acá." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-6">!</TableHead>
                <TableHead>Carpeta</TableHead>
                <TableHead>Cliente / Vehículo</TableHead>
                <TableHead className="w-32">Trámite</TableHead>
                <TableHead className="w-32">Reparación</TableHead>
                <TableHead>Motivos de prioridad</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {allItems.map((item) => (
                <TableRow key={item.caseId}>
                  <TableCell>
                    {item.priorityReasons?.some((r) => r === 'Pago pendiente' || r === 'Caso proximo a prescribir') ? (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    ) : (
                      <Clock3 className="h-4 w-4 text-warning-foreground" />
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold">{item.folderCode}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{item.caseTypeCode}</span>
                  </TableCell>
                  <TableCell className="text-sm">{item.title}</TableCell>
                  <TableCell>
                    <Badge variant={item.visibleTramiteState?.code === 'PAGADO' ? 'success' : 'secondary'}>
                      {item.visibleTramiteState?.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.visibleRepairState?.code === 'REPARADO' ? 'success' : (item.visibleRepairState?.code === 'DAR_TURNO' ? 'destructive' : 'outline')}>
                      {item.visibleRepairState?.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {item.priorityReasons?.map((reason) => (
                        <Badge key={reason} variant="destructive" className="text-[10px]">{reason}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => navigate(`/cases/${item.caseId}`)}>
                      <FolderOpen className="mr-1 h-3.5 w-3.5" />
                      Abrir
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  );
};
