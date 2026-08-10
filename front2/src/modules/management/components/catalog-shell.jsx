import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Search, Save, Trash2, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Dialog } from '@/shared/ui/dialog';
import { EmptyState } from '@/shared/ui/empty-state';
import { Input } from '@/shared/ui/input';

const useDebouncedValue = (value, delay = 300) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timeout = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timeout);
  }, [delay, value]);
  return debounced;
};

export const CatalogShell = ({ title, description, singular, queryPrefix, api, fields, createFields = fields, createPayload = (form) => form, createErrorMessage, initialForm, listLabel, invalidate = [], renderDetail }) => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [selectedId, setSelectedId] = useState(null);
  const [editing, setEditing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [form, setForm] = useState(initialForm());
  const listQuery = useQuery({ queryKey: [...queryPrefix, 'search', debouncedSearch], queryFn: () => api.list(debouncedSearch) });
  const detailQuery = useQuery({ queryKey: [...queryPrefix, selectedId], queryFn: () => api.get(selectedId), enabled: selectedId != null });

  useEffect(() => {
    if (detailQuery.data && !editing) setForm(initialForm(detailQuery.data));
  }, [detailQuery.data, editing, initialForm]);

  const invalidateCatalog = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryPrefix }),
      ...invalidate.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
    ]);
  };
  const saveMutation = useMutation({
    mutationFn: () => creating ? api.create(createPayload(form)) : api.update(selectedId, form),
    onSuccess: async (entity) => {
      await invalidateCatalog();
      setSelectedId(entity.id);
      setCreating(false);
      setEditing(false);
      toast.success(`${singular} ${creating ? 'creado' : 'actualizado'}.`);
    },
    onError: (error) => toast.error(creating ? createErrorMessage?.(error) || error.message || `No pude guardar el ${singular.toLowerCase()}.` : error.message || `No pude guardar el ${singular.toLowerCase()}.`),
  });
  const deactivateMutation = useMutation({
    mutationFn: () => api.deactivate(selectedId),
    onSuccess: async () => {
      await invalidateCatalog();
      setConfirmDeactivate(false);
      toast.success(`${singular} desactivado.`);
    },
    onError: (error) => toast.error(error.message || `No pude desactivar el ${singular.toLowerCase()}.`),
  });

  const discard = () => {
    setEditing(false);
    setCreating(false);
    setForm(initialForm(detailQuery.data));
  };
  const select = (id) => {
    if (editing || creating) {
      if (!window.confirm('Hay cambios sin guardar. ¿Querés descartarlos?')) return;
      discard();
    }
    setSelectedId(id);
  };
  const beginCreate = () => {
    if ((editing || creating) && !window.confirm('Hay cambios sin guardar. ¿Querés descartarlos?')) return;
    setSelectedId(null);
    setForm(initialForm());
    setCreating(true);
    setEditing(false);
  };
  const items = listQuery.data ?? [];
  const selected = detailQuery.data;
  const name = listLabel(selected || form);
  const hasUnsavedChanges = (editing || creating) && JSON.stringify(form) !== JSON.stringify(initialForm(creating ? {} : detailQuery.data));

  useEffect(() => {
    const warnBeforeUnload = (event) => {
      if (!hasUnsavedChanges) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warnBeforeUnload);
    return () => window.removeEventListener('beforeunload', warnBeforeUnload);
  }, [hasUnsavedChanges]);

  return (
    <div className="space-y-5">
      <Card className="border-white/60 bg-card/95 p-5 shadow-haze sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div><p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Gestión · Entidades</p><h2 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h2><p className="mt-2 max-w-3xl text-sm text-muted-foreground">{description}</p></div>
          <Button onClick={beginCreate}><Plus className="mr-2 h-4 w-4" />Nuevo</Button>
        </div>
      </Card>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Card className="border-white/60 bg-card/95 p-5 shadow-haze">
          <label className="relative block"><span className="sr-only">Buscar {title}</span><Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-11" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Buscar ${title.toLowerCase()}`} /></label>
          <div className="mt-4 space-y-2" aria-live="polite">
            {listQuery.isLoading ? <p className="py-10 text-center text-sm text-muted-foreground">Cargando resultados...</p> : null}
            {listQuery.isError ? <EmptyState title="No pude cargar el catálogo" description={listQuery.error.message} /> : null}
            {!listQuery.isLoading && !listQuery.isError && items.length === 0 ? <EmptyState title="Sin resultados" description="Probá con otra búsqueda o creá un registro." /> : null}
            {items.map((item) => <button key={item.id} type="button" onClick={() => select(item.id)} className={`flex min-h-11 w-full items-center justify-between rounded-2xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${item.id === selectedId ? 'border-primary bg-primary/5' : 'border-border/60 hover:bg-accent/50'}`}><span className="font-medium">{listLabel(item)}</span><Badge variant={item.active === false || item.activo === false ? 'outline' : 'secondary'}>{item.active === false || item.activo === false ? 'Inactivo' : 'Activo'}</Badge></button>)}
          </div>
        </Card>
        <Card className="border-white/60 bg-card/95 p-5 shadow-haze">
          {selectedId == null ? <EmptyState title={`Seleccioná un ${singular.toLowerCase()}`} description="Elegí un resultado para consultar su detalle." /> : detailQuery.isLoading ? <p className="py-16 text-center text-sm text-muted-foreground">Cargando detalle...</p> : detailQuery.isError ? <EmptyState title="No pude cargar el detalle" description={detailQuery.error.message} /> : <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Detalle</p><h3 className="mt-2 text-2xl font-semibold tracking-tight">{name}</h3></div>{!editing ? <div className="flex gap-2"><Button variant="outline" onClick={() => setEditing(true)}><Pencil className="mr-2 h-4 w-4" />Editar</Button>{selected?.active !== false && selected?.activo !== false ? <Button variant="outline" className="text-destructive" onClick={() => setConfirmDeactivate(true)}><Trash2 className="mr-2 h-4 w-4" />Desactivar</Button> : null}</div> : null}</div>
            {editing ? <CatalogForm fields={fields} form={form} setForm={setForm} /> : <div className="grid gap-3 sm:grid-cols-2">{fields.map((field) => <div key={field.name} className="rounded-2xl border border-border/60 bg-background/70 p-4"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{field.label}</p><p className="mt-2 text-sm">{field.display ? field.display(selected?.[field.name]) : selected?.[field.name] || '-'}</p></div>)}</div>}
            {!editing && renderDetail ? renderDetail(selected) : null}
            {editing ? <div className="flex justify-end gap-2"><Button variant="outline" onClick={discard}><Undo2 className="mr-2 h-4 w-4" />Cancelar</Button><Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}><Save className="mr-2 h-4 w-4" />Guardar</Button></div> : null}
          </div>}
        </Card>
      </div>
      <Dialog open={confirmDeactivate} onClose={() => setConfirmDeactivate(false)} title={`¿Desactivar ${name}?`} description="Los registros existentes se conservan y ya no estará disponible para nuevas selecciones."><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setConfirmDeactivate(false)}>Cancelar</Button><Button variant="destructive" disabled={deactivateMutation.isPending} onClick={() => deactivateMutation.mutate()}>Desactivar</Button></div></Dialog>
      <Dialog open={creating} onClose={discard} title={`Nuevo ${singular.toLowerCase()}`} description="Completá los datos para incorporarlo al catálogo."><CatalogForm fields={createFields} form={form} setForm={setForm} /><div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={discard}>Cancelar</Button><Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}><Save className="mr-2 h-4 w-4" />Guardar</Button></div></Dialog>
    </div>
  );
};

const CatalogForm = ({ fields, form, setForm }) => <div className="grid gap-3 sm:grid-cols-2">{fields.map((field) => <label key={field.name} className={field.fullWidth ? 'space-y-2 sm:col-span-2' : 'space-y-2'}><span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{field.label}{field.required ? ' *' : ''}</span>{field.type === 'checkbox' ? <input aria-label={field.label} type="checkbox" checked={Boolean(form[field.name])} onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.checked }))} /> : <Input type={field.type || 'text'} value={form[field.name] ?? ''} required={field.required} onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))} />}</label>)}</div>;
