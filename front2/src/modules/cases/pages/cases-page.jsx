import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FolderOpen, Search, Filter } from 'lucide-react';
import { listCases } from '@/modules/cases/api/cases-api';
import { getCaseCatalogs } from '@/modules/cases/api/new-case-api';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/ui/table';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Select } from '@/shared/ui/select';
import { Card } from '@/shared/ui/card';
import { EmptyState } from '@/shared/ui/empty-state';
import { FullScreenLoader } from '@/shared/ui/full-screen-loader';

const formatDate = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' });
};

export const CasesPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [tramiteFilter, setTramiteFilter] = useState('');
  const [repairFilter, setRepairFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const catalogsQuery = useQuery({
    queryKey: ['cases', 'catalogs'],
    queryFn: getCaseCatalogs,
  });

  const casesQuery = useQuery({
    queryKey: ['cases', 'list', search, tramiteFilter, repairFilter, typeFilter],
    queryFn: () => listCases({
      size: 200,
      q: search || undefined,
      caseTypeCode: typeFilter || undefined,
      visibleTramiteState: tramiteFilter || undefined,
      visibleRepairState: repairFilter || undefined,
    }),
  });

  const caseTypes = catalogsQuery.data?.caseTypes ?? [];
  const items = casesQuery.data?.items ?? [];

  const tramiteStateOptions = useMemo(() => {
    const codes = new Set(items.map((item) => item.visibleTramiteState?.code).filter(Boolean));
    return Array.from(codes).sort();
  }, [items]);

  const repairStateOptions = useMemo(() => {
    const codes = new Set(items.map((item) => item.visibleRepairState?.code).filter(Boolean));
    return Array.from(codes).sort();
  }, [items]);

  if (casesQuery.isLoading) {
    return <FullScreenLoader label="Cargando carpetas..." compact />;
  }

  if (casesQuery.isError) {
    return <EmptyState title="No pude cargar las carpetas" description={casesQuery.error.message} />;
  }

  return (
    <div className="space-y-5">
      <Card className="border-white/50 bg-card/90 p-6 shadow-haze">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Carpetas</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Listado operativo</h2>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline">{items.length} carpetas</Badge>
            <Badge variant="secondary">Tabla filtrable</Badge>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <div className="flex min-w-[220px] flex-1 items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por carpeta, cliente, dominio..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Select className="w-auto min-w-[160px]" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
            <option value="">Todos los tipos</option>
            {caseTypes.map((ct) => <option key={ct.id} value={ct.code}>{ct.name}</option>)}
          </Select>
          <Select className="w-auto min-w-[160px]" value={tramiteFilter} onChange={(event) => setTramiteFilter(event.target.value)}>
            <option value="">Trámite: todos</option>
            {tramiteStateOptions.map((code) => <option key={code} value={code}>{code}</option>)}
          </Select>
          <Select className="w-auto min-w-[160px]" value={repairFilter} onChange={(event) => setRepairFilter(event.target.value)}>
            <option value="">Reparación: todos</option>
            {repairStateOptions.map((code) => <option key={code} value={code}>{code}</option>)}
          </Select>
        </div>
      </Card>

      {items.length === 0 ? (
        <EmptyState title="Sin carpetas que mostrar" description="Probá ajustando los filtros o creá un nuevo caso." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Carpeta</TableHead>
              <TableHead>Cliente / Vehículo</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="w-28">Trámite</TableHead>
              <TableHead className="w-28">Reparación</TableHead>
              <TableHead className="w-28">Creada</TableHead>
              <TableHead className="w-20">Cierre</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-semibold">{item.folderCode}</TableCell>
                <TableCell>
                  <span className="text-sm">{item.principalCustomerName || '-'}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{item.principalVehiclePlate || ''}</span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{item.caseTypeCode}</Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={item.visibleTramiteState?.code === 'PAGADO' ? 'success' : (item.visibleTramiteState?.code === 'PASADO_A_PAGOS' ? 'destructive' : 'secondary')}
                  >
                    {item.visibleTramiteState?.label || item.currentCaseStateCode}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={item.visibleRepairState?.code === 'REPARADO' ? 'success' : (item.visibleRepairState?.code === 'DAR_TURNO' ? 'destructive' : 'outline')}
                  >
                    {item.visibleRepairState?.label || item.currentRepairStateCode}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatDate(item.closedAt)}</TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" onClick={() => navigate(`/cases/${item.id}`)}>
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
