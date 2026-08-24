import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Plus, Save, User, X } from 'lucide-react';
import { toast } from 'sonner';
import { requestJson } from '@/shared/api/http-client';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Dialog } from '@/shared/ui/dialog';

const Field = ({ label, children, className = '' }) => (
  <div className={`min-w-0 ${className}`}>
    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</label>
    {children}
  </div>
);

const ContactSelector = ({ label, companyId, selectedPersonId, roleCode, onSelect, onClear }) => {
  const queryClient = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [newNombre, setNewNombre] = useState('');
  const [newApellido, setNewApellido] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newTelefono, setNewTelefono] = useState('');

  const contactsQuery = useQuery({
    queryKey: ['insurance', 'company', companyId, 'contacts'],
    queryFn: () => requestJson(`/insurance/companies/${companyId}/contacts`),
    enabled: !!companyId,
  });
  const contacts = (contactsQuery.data ?? []).filter(c => c.contactRoleCode === roleCode);
  const personQuery = useQuery({
    queryKey: ['persons', selectedPersonId],
    queryFn: () => requestJson(`/persons/${selectedPersonId}`),
    enabled: !!selectedPersonId,
  });
  const selected = personQuery.data;

  const createMutation = useMutation({
    mutationFn: async () => {
      const person = await requestJson('/persons', { method: 'POST', body: JSON.stringify({
        tipoPersona: 'fisica', nombre: newNombre, apellido: newApellido,
        tipoDocumentoCodigo: 'DNI', numeroDocumento: '',
        emailPrincipal: newEmail || null, telefonoPrincipal: newTelefono || null,
        activo: true,
      })});
      await requestJson(`/insurance/companies/${companyId}/contacts`, { method: 'POST', body: JSON.stringify({
        personId: person.id, contactRoleCode: roleCode,
      })});
      return person;
    },
    onSuccess: (person) => {
      queryClient.invalidateQueries({ queryKey: ['insurance', 'company', companyId, 'contacts'] });
      onSelect(person.id);
      setShowNew(false); setNewNombre(''); setNewApellido(''); setNewEmail(''); setNewTelefono('');
      toast.success('Contacto creado.');
    },
    onError: (e) => toast.error(e.message),
  });

  const handleCreate = (event) => {
    event.preventDefault();
    createMutation.mutate();
  };

  if (!companyId) return <Field label={label}><p className="mt-1 text-sm text-muted-foreground">Seleccioná una compañía</p></Field>;

  if (selectedPersonId && selected) {
    return (
      <Field label={label}>
        <div className="mt-0.5 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 dark:border-emerald-800 dark:bg-emerald-950">
          <User className="h-4 w-4 shrink-0 text-emerald-600" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{selected.nombreMostrar || `${selected.nombre || ''} ${selected.apellido || ''}`.trim()}</p>
            <p className="text-xs text-muted-foreground">{selected.emailPrincipal || '—'} · {selected.telefonoPrincipal || '—'}</p>
          </div>
          <button type="button" className="shrink-0 text-muted-foreground hover:text-destructive" onClick={onClear}>
            <X className="h-4 w-4" />
          </button>
        </div>
      </Field>
    );
  }

  return (
    <Field label={label}>
      {contacts.length > 0 ? (
        <select value="" onChange={(e) => { if (e.target.value === '__new') { setShowNew(true); } else if (e.target.value) { onSelect(Number(e.target.value)); } }}
          className="mt-0.5 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20">
          <option value="">Seleccionar...</option>
          {contacts.map((c) => (<option key={c.id} value={c.personId}>{c.personName || `#${c.personId}`}</option>))}
          <option disabled>──────────</option>
          <option value="__new">+ Crear nuevo</option>
        </select>
      ) : (
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground">Sin contactos.</p>
          <Button type="button" size="sm" variant="outline" onClick={() => setShowNew(true)}><Plus className="mr-1 h-3 w-3" />Crear</Button>
        </div>
      )}

      {showNew ? (
        <Dialog open={showNew} onClose={() => setShowNew(false)} title={`${label} - Crear nuevo contacto`}>
          <form className="space-y-3" onSubmit={handleCreate}>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Nombre</label>
                  <Input value={newNombre} onChange={(e) => setNewNombre(e.target.value)} placeholder="Nombre" />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Apellido</label>
                  <Input value={newApellido} onChange={(e) => setNewApellido(e.target.value)} placeholder="Apellido" />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Correo</label>
                  <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="correo@compania.com" />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Teléfono</label>
                  <Input value={newTelefono} onChange={(e) => setNewTelefono(e.target.value)} placeholder="341 555-1234" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={!newNombre || createMutation.isPending}>Crear</Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setShowNew(false)}>Cancelar</Button>
              </div>
          </form>
        </Dialog>
      ) : null}
    </Field>
  );
};

export const InsuranceDataSection = ({ caseId, caseDetail }) => {
  const queryClient = useQueryClient();

  const insuranceQuery = useQuery({ queryKey: ['cases', String(caseId), 'insurance'], queryFn: () => requestJson(`/cases/${caseId}/insurance`) });
  const companiesQuery = useQuery({ queryKey: ['insurance', 'companies'], queryFn: () => requestJson('/insurance/companies') });

  const insurance = insuranceQuery.data;
  const companies = companiesQuery.data ?? [];

  const [companyId, setCompanyId] = useState(null);
  const [tramitadorId, setTramitadorId] = useState(null);
  const [inspectorId, setInspectorId] = useState(null);
  const [draft, setDraft] = useState({ claimNumber: '', coverageDetail: '' });

  useEffect(() => {
    if (insurance?.insuranceCompanyId) setCompanyId(insurance.insuranceCompanyId);
    if (insurance?.processorPersonId) setTramitadorId(insurance.processorPersonId);
    if (insurance?.inspectorPersonId) setInspectorId(insurance.inspectorPersonId);
    if (insurance) setDraft({ claimNumber: insurance.claimNumber ?? '', coverageDetail: insurance.coverageDetail ?? '' });
  }, [insurance?.insuranceCompanyId, insurance?.processorPersonId, insurance?.inspectorPersonId]);

  const mutation = useMutation({
    mutationFn: (payload) => requestJson(`/cases/${caseId}/insurance`, { method: 'PUT', body: JSON.stringify(payload) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'insurance'] }); toast.success('Seguro guardado.'); },
    onError: (e) => toast.error(e.message),
  });

  const handleSave = () => {
    if (!companyId) { toast.error('Seleccioná una compañía.'); return; }
    mutation.mutate({
      insuranceCompanyId: Number(companyId),
      policyNumber: insurance?.policyNumber ?? null,
      certificateNumber: insurance?.certificateNumber ?? null,
      claimNumber: draft.claimNumber || null,
      coverageDetail: draft.coverageDetail || null,
      processorCasePersonId: tramitadorId,
      inspectorCasePersonId: inspectorId,
    });
  };

  return (
    <div className="rounded-3xl border border-border/70 bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Building2 className="h-5 w-5" />
          </div>
          <h4 className="text-sm font-semibold">Datos del seguro</h4>
        </div>
        <Button type="button" size="sm" onClick={handleSave} disabled={mutation.isPending}><Save className="mr-1.5 h-3.5 w-3.5" />Guardar</Button>
      </div>

      <div className="mt-4 space-y-4">
        <div className="grid gap-x-6 gap-y-3 md:grid-cols-2">
          <Field label="Cía. aseguradora">
            <select value={companyId ?? ''} onChange={(e) => setCompanyId(e.target.value ? Number(e.target.value) : null)}
              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20">
              <option value="">Seleccionar...</option>
              {companies.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
          </Field>
          <Field label="N° de Siniestro">
            <Input name="claimNumber" value={draft.claimNumber} onChange={(event) => setDraft((current) => ({ ...current, claimNumber: event.target.value }))} placeholder="Ej: 4-2541587" />
          </Field>
        </div>

        <div className="grid gap-x-6 gap-y-3 md:grid-cols-2">
          <ContactSelector label="Tramitador/a" companyId={companyId} selectedPersonId={tramitadorId} roleCode="TRAMITADOR"
            onSelect={setTramitadorId} onClear={() => setTramitadorId(null)} />
          <ContactSelector label="Inspector/a" companyId={companyId} selectedPersonId={inspectorId} roleCode="INSPECTOR"
            onSelect={setInspectorId} onClear={() => setInspectorId(null)} />
        </div>

        <Field label="Detalle de la cobertura">
          <Input name="coverageDetail" value={draft.coverageDetail} onChange={(event) => setDraft((current) => ({ ...current, coverageDetail: event.target.value }))} placeholder="Ej: Cobertura para luneta y equipo de GNC" />
        </Field>
      </div>
    </div>
  );
};
