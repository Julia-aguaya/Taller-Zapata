import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CarFront, Pencil, Save, Search, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import { getVehicleCatalogs, searchVehicles } from '@/modules/cases/api/new-case-api';
import { requestJson } from '@/shared/api/http-client';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { EmptyState } from '@/shared/ui/empty-state';
import { Input } from '@/shared/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

const fetchVehicle = (vehicleId) => requestJson(`/vehicles/${vehicleId}`);
const updateVehicle = (vehicleId, payload) => requestJson(`/vehicles/${vehicleId}`, { method: 'PUT', body: JSON.stringify(payload) });

const createVehicleForm = (vehicle) => ({
  brandText: vehicle?.brandText || '',
  modelText: vehicle?.modelText || '',
  plate: vehicle?.plate || '',
  year: vehicle?.year ? String(vehicle.year) : '',
  vehicleTypeCode: vehicle?.vehicleTypeCode || '',
  usageCode: vehicle?.usageCode || '',
  transmissionCode: vehicle?.transmissionCode || '',
  color: vehicle?.color || '',
  paintCode: vehicle?.paintCode || '',
  chasis: vehicle?.chasis || '',
  motor: vehicle?.motor || '',
  mileage: vehicle?.mileage ? String(vehicle.mileage) : '',
  observaciones: vehicle?.observaciones || '',
});

export const ManagementVehiclesPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(createVehicleForm(null));

  const normalizedSearch = search.trim();

  const vehiclesQuery = useQuery({
    queryKey: ['management', 'vehicles', 'search', normalizedSearch],
    queryFn: () => searchVehicles({ q: normalizedSearch, plate: normalizedSearch }),
    enabled: normalizedSearch.length >= 2,
  });

  const vehicleQuery = useQuery({
    queryKey: ['management', 'vehicles', selectedVehicleId],
    queryFn: () => fetchVehicle(selectedVehicleId),
    enabled: Boolean(selectedVehicleId),
  });

  const catalogsQuery = useQuery({
    queryKey: ['management', 'vehicles', 'catalogs'],
    queryFn: getVehicleCatalogs,
  });

  useEffect(() => {
    if (vehicleQuery.data) {
      setForm(createVehicleForm(vehicleQuery.data));
    }
  }, [vehicleQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () => updateVehicle(selectedVehicleId, {
      brandId: vehicleQuery.data?.brandId ?? null,
      modelId: vehicleQuery.data?.modelId ?? null,
      brandText: form.brandText || null,
      modelText: form.modelText || null,
      plate: form.plate || null,
      year: form.year ? Number(form.year) : null,
      vehicleTypeCode: form.vehicleTypeCode || null,
      usageCode: form.usageCode || null,
      color: form.color || null,
      paintCode: form.paintCode || null,
      chasis: form.chasis || null,
      motor: form.motor || null,
      transmissionCode: form.transmissionCode || null,
      mileage: form.mileage ? Number(form.mileage) : null,
      observaciones: form.observaciones || null,
      activo: vehicleQuery.data?.activo ?? true,
    }),
    onSuccess: async () => {
      setEditing(false);
      await queryClient.invalidateQueries({ queryKey: ['management', 'vehicles', selectedVehicleId] });
      toast.success('Vehículo actualizado.');
    },
    onError: (error) => toast.error(error.message || 'No pude actualizar el vehículo.'),
  });

  const selectedVehicle = vehicleQuery.data;
  const visibleResults = vehiclesQuery.data ?? [];
  const hasSearch = normalizedSearch.length >= 2;
  const vehicleTypeOptions = (catalogsQuery.data?.vehicleTypeCodes ?? []).map((item) => item.code);
  const usageOptions = (catalogsQuery.data?.usageCodes ?? []).map((item) => item.code);
  const transmissionOptions = (catalogsQuery.data?.transmissionCodes ?? []).map((item) => item.code);
  const summaryRows = useMemo(() => ([
    ['Patente', selectedVehicle?.plate || '-'],
    ['Marca', selectedVehicle?.brandText || '-'],
    ['Modelo', selectedVehicle?.modelText || '-'],
    ['Estado', selectedVehicle?.activo == null ? '-' : selectedVehicle.activo ? 'Activo' : 'Inactivo'],
  ]), [selectedVehicle]);

  return (
    <div className="space-y-5">
      <Card className="border-white/60 bg-card/95 p-5 shadow-haze sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Gestión · Personas y vehículos</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Vehículos</h2>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Consultá vehículos reales por patente o texto libre. La edición impacta en todas las carpetas donde ese vehículo ya está vinculado.
            </p>
          </div>
          <Badge variant="outline">Consulta real + edición global</Badge>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)]">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Búsqueda</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-11"
                placeholder="Buscar por patente, marca o modelo"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </label>
          <div className="rounded-3xl border border-border/60 bg-background/70 p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Contrato confirmado</p>
            <p className="mt-2"><code>GET /vehicles?q=</code> y <code>GET /vehicles/:id</code> permiten búsqueda y detalle. <code>PUT /vehicles/:id</code> ya se usa en la ficha técnica de carpeta.</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <Card className="border-white/60 bg-card/95 p-5 shadow-haze">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold tracking-tight">Resultados</h3>
              <p className="text-sm text-muted-foreground">No se muestra ningún vehículo hasta tener una búsqueda real.</p>
            </div>
            {hasSearch && !vehiclesQuery.isLoading ? <Badge variant="outline">{visibleResults.length} encontrados</Badge> : null}
          </div>

          {!hasSearch ? (
            <EmptyState title="Empezá con una búsqueda" description="Escribí al menos 2 caracteres para consultar vehículos reales del backend." />
          ) : vehiclesQuery.isError ? (
            <EmptyState title="No pude consultar vehículos" description={vehiclesQuery.error.message} />
          ) : visibleResults.length === 0 && !vehiclesQuery.isLoading ? (
            <EmptyState title="Sin coincidencias" description="No llegaron vehículos para esa búsqueda." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehículo</TableHead>
                  <TableHead>Patente</TableHead>
                  <TableHead>Año</TableHead>
                  <TableHead className="text-right">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleResults.map((vehicle) => {
                  const isActive = selectedVehicleId === vehicle.id;
                  return (
                    <TableRow key={vehicle.id} className={isActive ? 'bg-accent/40' : ''}>
                      <TableCell>
                        <button type="button" className="text-left" onClick={() => { setSelectedVehicleId(vehicle.id); setEditing(false); }}>
                          <span className="block font-medium text-foreground">{[vehicle.brandText, vehicle.modelText].filter(Boolean).join(' ') || 'Vehículo sin descripción'}</span>
                          <span className="text-xs text-muted-foreground">{vehicle.vehicleTypeCode || 'Sin tipo'}</span>
                        </button>
                      </TableCell>
                      <TableCell>{vehicle.plate || '-'}</TableCell>
                      <TableCell>{vehicle.year || '-'}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={vehicle.activo === false ? 'outline' : 'secondary'}>{vehicle.activo === false ? 'Inactivo' : 'Activo'}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Card>

        <Card className="border-white/60 bg-card/95 p-5 shadow-haze">
          {!selectedVehicleId ? (
            <EmptyState title="Seleccioná un vehículo" description="Elegí un resultado para ver detalle y edición global." />
          ) : vehicleQuery.isLoading ? (
            <div className="py-16 text-center text-sm text-muted-foreground">Cargando detalle del vehículo...</div>
          ) : vehicleQuery.isError ? (
            <EmptyState title="No pude cargar el detalle" description={vehicleQuery.error.message} />
          ) : (
            <div className="space-y-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Detalle</p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight">{selectedVehicle?.plate || 'Vehículo sin patente'}</h3>
                </div>
                {editing ? (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => { setEditing(false); setForm(createVehicleForm(selectedVehicle)); }}>
                      <Undo2 className="mr-2 h-4 w-4" />Cancelar
                    </Button>
                    <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                      <Save className="mr-2 h-4 w-4" />Guardar
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" onClick={() => setEditing(true)}>
                    <Pencil className="mr-2 h-4 w-4" />Editar
                  </Button>
                )}
              </div>

              <div className="rounded-3xl border border-amber-300 bg-amber-50/90 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-100">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <p>Antes de guardar: este cambio modifica el registro global del vehículo y se refleja en todas las carpetas relacionadas.</p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {summaryRows.map(([label, value]) => (
                  <ReadOnlyRow key={label} label={label} value={value} />
                ))}
              </div>

              <div className="rounded-3xl border border-border/60 bg-background/70 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <CarFront className="h-4 w-4 text-primary" />
                  <h4 className="font-semibold">Edición global</h4>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Marca" value={form.brandText} disabled={!editing} onChange={(value) => setForm((current) => ({ ...current, brandText: value }))} />
                  <Field label="Modelo" value={form.modelText} disabled={!editing} onChange={(value) => setForm((current) => ({ ...current, modelText: value }))} />
                  <Field label="Patente" value={form.plate} disabled={!editing} onChange={(value) => setForm((current) => ({ ...current, plate: value.toUpperCase() }))} />
                  <Field label="Año" value={form.year} disabled={!editing} type="number" onChange={(value) => setForm((current) => ({ ...current, year: value }))} />
                  <SelectField label="Tipo" value={form.vehicleTypeCode} disabled={!editing} options={vehicleTypeOptions} onChange={(value) => setForm((current) => ({ ...current, vehicleTypeCode: value }))} />
                  <SelectField label="Uso" value={form.usageCode} disabled={!editing} options={usageOptions} onChange={(value) => setForm((current) => ({ ...current, usageCode: value }))} />
                  <SelectField label="Caja" value={form.transmissionCode} disabled={!editing} options={transmissionOptions} onChange={(value) => setForm((current) => ({ ...current, transmissionCode: value }))} />
                  <Field label="Color" value={form.color} disabled={!editing} onChange={(value) => setForm((current) => ({ ...current, color: value }))} />
                  <Field label="Pintura" value={form.paintCode} disabled={!editing} onChange={(value) => setForm((current) => ({ ...current, paintCode: value }))} />
                  <Field label="Chasis" value={form.chasis} disabled={!editing} onChange={(value) => setForm((current) => ({ ...current, chasis: value }))} />
                  <Field label="Motor" value={form.motor} disabled={!editing} onChange={(value) => setForm((current) => ({ ...current, motor: value }))} />
                  <Field label="Kilometraje" value={form.mileage} disabled={!editing} type="number" onChange={(value) => setForm((current) => ({ ...current, mileage: value }))} />
                </div>
                <div className="mt-3 space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Observaciones</span>
                  <textarea
                    className="flex min-h-[90px] w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-70"
                    value={form.observaciones}
                    onChange={(event) => setForm((current) => ({ ...current, observaciones: event.target.value }))}
                    disabled={!editing}
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-border/60 bg-background/70 p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Cliente asociado y carpetas relacionadas</p>
                <p className="mt-2">El contrato actual no expone relación global vehículo-cliente ni historial de carpetas por vehículo.</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

const ReadOnlyRow = ({ label, value }) => (
  <div className="rounded-3xl border border-border/60 bg-background/70 p-4">
    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
    <p className="mt-2 text-sm text-foreground">{value || '-'}</p>
  </div>
);

const Field = ({ label, value, onChange, disabled, type = 'text' }) => (
  <label className="space-y-2">
    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
    <Input value={value} type={type} disabled={disabled} onChange={(event) => onChange(event.target.value)} />
  </label>
);

const SelectField = ({ label, value, onChange, disabled, options }) => (
  <label className="space-y-2">
    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
    <select
      className="flex h-12 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-70"
      value={value}
      disabled={disabled || options.length === 0}
      onChange={(event) => onChange(event.target.value)}
    >
      {options.length === 0 ? <option value="">Sin opciones</option> : options.map((option) => <option key={option} value={option}>{option}</option>)}
    </select>
  </label>
);
