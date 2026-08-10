import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Pencil, Save, Search, Undo2, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { getPersonVehicles, searchPersons } from '@/modules/cases/api/new-case-api';
import { requestJson } from '@/shared/api/http-client';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { EmptyState } from '@/shared/ui/empty-state';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

const fetchPerson = (personId) => requestJson(`/persons/${personId}`);
const updatePerson = (personId, payload) => requestJson(`/persons/${personId}`, { method: 'PUT', body: JSON.stringify(payload) });

const DOC_TYPE_OPTIONS = ['DNI', 'LE', 'LC', 'CI', 'PASAPORTE', 'CUIT'];
const CIVIL_STATUS_OPTIONS = ['SOLTERO', 'CASADO', 'VIUDO', 'DIVORCIADO', 'NO_INFORMA'];

const createPersonForm = (person) => ({
  nombre: person?.nombre || '',
  apellido: person?.apellido || '',
  tipoDocumentoCodigo: person?.tipoDocumentoCodigo || 'DNI',
  numeroDocumento: person?.numeroDocumento || '',
  cuitCuil: person?.cuitCuil || '',
  telefonoPrincipal: person?.telefonoPrincipal || '',
  emailPrincipal: person?.emailPrincipal || '',
  ocupacion: person?.ocupacion || '',
  fechaNacimiento: person?.fechaNacimiento || '',
  estadoCivilCodigo: person?.estadoCivilCodigo || 'NO_INFORMA',
  observaciones: person?.observaciones || '',
});

export const ManagementClientsPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedPersonId, setSelectedPersonId] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(createPersonForm(null));

  const normalizedSearch = debouncedSearch.trim();

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => window.clearTimeout(timeout);
  }, [search]);

  const personsQuery = useQuery({
    queryKey: ['management', 'clients', 'search', normalizedSearch],
    queryFn: () => searchPersons({ q: normalizedSearch, document: normalizedSearch }),
    enabled: true,
  });

  const personQuery = useQuery({
    queryKey: ['management', 'clients', selectedPersonId],
    queryFn: () => fetchPerson(selectedPersonId),
    enabled: Boolean(selectedPersonId),
  });

  const vehiclesQuery = useQuery({
    queryKey: ['management', 'clients', selectedPersonId, 'vehicles'],
    queryFn: () => getPersonVehicles(selectedPersonId),
    enabled: Boolean(selectedPersonId),
  });

  useEffect(() => {
    if (personQuery.data) {
      setForm(createPersonForm(personQuery.data));
    }
  }, [personQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () => updatePerson(selectedPersonId, {
      tipoPersona: personQuery.data?.tipoPersona || 'fisica',
      nombre: form.nombre,
      apellido: form.apellido,
      razonSocial: personQuery.data?.razonSocial || null,
      tipoDocumentoCodigo: form.tipoDocumentoCodigo || 'DNI',
      numeroDocumento: form.numeroDocumento || null,
      cuitCuil: form.cuitCuil || null,
      fechaNacimiento: form.fechaNacimiento || null,
      estadoCivilCodigo: form.estadoCivilCodigo || null,
      telefonoPrincipal: form.telefonoPrincipal || null,
      emailPrincipal: form.emailPrincipal || null,
      ocupacion: form.ocupacion || null,
      observaciones: form.observaciones || null,
      activo: personQuery.data?.activo ?? true,
    }),
    onSuccess: async () => {
      setEditing(false);
      await queryClient.invalidateQueries({ queryKey: ['management', 'clients', selectedPersonId] });
      toast.success('Cliente actualizado.');
    },
    onError: (error) => toast.error(error.message || 'No pude actualizar el cliente.'),
  });

  const selectedPerson = personQuery.data;
  const visibleResults = personsQuery.data ?? [];
  const personDisplayName = selectedPerson?.nombreMostrar || [selectedPerson?.nombre, selectedPerson?.apellido].filter(Boolean).join(' ') || 'Cliente';
  const relatedVehicles = vehiclesQuery.data ?? [];
  const primaryRows = useMemo(() => ([
    ['Nombre visible', selectedPerson?.nombreMostrar || '-'],
    ['Documento', [selectedPerson?.tipoDocumentoCodigo, selectedPerson?.numeroDocumento].filter(Boolean).join(' ') || '-'],
    ['Teléfono', selectedPerson?.telefonoPrincipal || '-'],
    ['Email', selectedPerson?.emailPrincipal || '-'],
    ['Activo', selectedPerson?.activo == null ? '-' : selectedPerson.activo ? 'Sí' : 'No'],
  ]), [selectedPerson]);

  return (
    <div className="space-y-5">
      <Card className="border-white/60 bg-card/95 p-5 shadow-haze sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Gestión · Personas y vehículos</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Clientes</h2>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Consultá clientes reales por nombre o documento. La edición impacta en todas las carpetas donde ese cliente ya está vinculado.
            </p>
          </div>
          <Badge variant="outline">Catálogo de clientes</Badge>
        </div>

        <div className="mt-5">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Búsqueda</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-11"
                placeholder="Buscar por nombre, apellido o documento"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </label>
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <Card className="border-white/60 bg-card/95 p-5 shadow-haze">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold tracking-tight">Resultados</h3>
              <p className="text-sm text-muted-foreground">Seleccioná un cliente para consultar y actualizar sus datos.</p>
            </div>
            {!personsQuery.isLoading ? <Badge variant="outline">{visibleResults.length} encontrados</Badge> : null}
          </div>

          {personsQuery.isError ? (
            <EmptyState title="No pude consultar clientes" description={personsQuery.error.message} />
          ) : visibleResults.length === 0 && !personsQuery.isLoading ? (
            <EmptyState title="Sin coincidencias" description="Probá con otra búsqueda." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead className="text-right">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleResults.map((person) => {
                  const isActive = selectedPersonId === person.id;
                  return (
                    <TableRow key={person.id} className={isActive ? 'bg-accent/40' : ''}>
                      <TableCell>
                        <button type="button" className="text-left" onClick={() => { setSelectedPersonId(person.id); setEditing(false); }}>
                          <span className="block font-medium text-foreground">{person.nombreMostrar || [person.nombre, person.apellido].filter(Boolean).join(' ') || 'Sin nombre visible'}</span>
                          <span className="text-xs text-muted-foreground">{person.tipoPersona || 'Persona'}</span>
                        </button>
                      </TableCell>
                      <TableCell>{[person.tipoDocumentoCodigo, person.numeroDocumento].filter(Boolean).join(' ') || '-'}</TableCell>
                      <TableCell>{person.telefonoPrincipal || person.emailPrincipal || '-'}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={person.activo === false ? 'outline' : 'secondary'}>{person.activo === false ? 'Inactivo' : 'Activo'}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Card>

        <Card className="border-white/60 bg-card/95 p-5 shadow-haze">
          {!selectedPersonId ? (
            <EmptyState title="Seleccioná un cliente" description="Elegí un resultado para ver detalle, vehículos vinculados y edición global." />
          ) : personQuery.isLoading ? (
            <div className="py-16 text-center text-sm text-muted-foreground">Cargando detalle del cliente...</div>
          ) : personQuery.isError ? (
            <EmptyState title="No pude cargar el detalle" description={personQuery.error.message} />
          ) : (
            <div className="space-y-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Detalle</p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight">{personDisplayName}</h3>
                </div>
                {editing ? (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => { setEditing(false); setForm(createPersonForm(selectedPerson)); }}>
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
                  <p>Antes de guardar: este cambio modifica el registro global del cliente y se refleja en todas las carpetas relacionadas.</p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {primaryRows.map(([label, value]) => (
                  <ReadOnlyRow key={label} label={label} value={value} />
                ))}
              </div>

              <div className="rounded-3xl border border-border/60 bg-background/70 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <UserRound className="h-4 w-4 text-primary" />
                  <h4 className="font-semibold">Edición global</h4>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Nombre" value={form.nombre} disabled={!editing} onChange={(value) => setForm((current) => ({ ...current, nombre: value }))} />
                  <Field label="Apellido" value={form.apellido} disabled={!editing} onChange={(value) => setForm((current) => ({ ...current, apellido: value }))} />
                  <SelectField label="Tipo documento" value={form.tipoDocumentoCodigo} disabled={!editing} options={DOC_TYPE_OPTIONS} onChange={(value) => setForm((current) => ({ ...current, tipoDocumentoCodigo: value }))} />
                  <Field label="Documento" value={form.numeroDocumento} disabled={!editing} onChange={(value) => setForm((current) => ({ ...current, numeroDocumento: value }))} />
                  <SelectField label="Estado civil" value={form.estadoCivilCodigo} disabled={!editing} options={CIVIL_STATUS_OPTIONS} onChange={(value) => setForm((current) => ({ ...current, estadoCivilCodigo: value }))} />
                  <Field label="CUIT/CUIL" value={form.cuitCuil} disabled={!editing} onChange={(value) => setForm((current) => ({ ...current, cuitCuil: value }))} />
                  <Field label="Teléfono" value={form.telefonoPrincipal} disabled={!editing} onChange={(value) => setForm((current) => ({ ...current, telefonoPrincipal: value }))} />
                  <Field label="Email" value={form.emailPrincipal} disabled={!editing} type="email" onChange={(value) => setForm((current) => ({ ...current, emailPrincipal: value }))} />
                  <Field label="Ocupación" value={form.ocupacion} disabled={!editing} onChange={(value) => setForm((current) => ({ ...current, ocupacion: value }))} />
                  <Field label="Fecha nacimiento" value={form.fechaNacimiento} disabled={!editing} type="date" onChange={(value) => setForm((current) => ({ ...current, fechaNacimiento: value }))} />
                </div>
                <div className="mt-3 space-y-2">
                  <Label>Observaciones</Label>
                  <textarea
                    className="flex min-h-[90px] w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-70"
                    value={form.observaciones}
                    onChange={(event) => setForm((current) => ({ ...current, observaciones: event.target.value }))}
                    disabled={!editing}
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-border/60 bg-background/70 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-semibold">Vehículos relacionados</h4>
                    <p className="text-sm text-muted-foreground">Vehículos vinculados históricamente a este cliente.</p>
                  </div>
                  {!vehiclesQuery.isLoading ? <Badge variant="outline">{relatedVehicles.length}</Badge> : null}
                </div>
                {vehiclesQuery.isLoading ? (
                  <p className="text-sm text-muted-foreground">Buscando vehículos del cliente...</p>
                ) : relatedVehicles.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay vehículos vinculados.</p>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {relatedVehicles.map((vehicle) => (
                      <div key={vehicle.id} className="rounded-2xl border border-border/60 bg-card/80 p-4">
                        <p className="font-medium text-foreground">{[vehicle.brandText, vehicle.modelText].filter(Boolean).join(' ') || 'Vehículo sin descripción'}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{vehicle.plate || 'Sin patente'}{vehicle.year ? ` · ${vehicle.year}` : ''}</p>
                      </div>
                    ))}
                  </div>
                )}
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
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
    >
      {options.map((option) => <option key={option} value={option}>{option}</option>)}
    </select>
  </label>
);
