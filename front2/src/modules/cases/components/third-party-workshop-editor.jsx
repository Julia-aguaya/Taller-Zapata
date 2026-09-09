import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Building2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { ClaimDataSection } from '@/modules/cases/components/claim-data-section';
import { DocumentsSection } from '@/modules/cases/components/documents-section';
import { ProcedureSection } from '@/modules/cases/components/procedure-section';
import { TaskAgenda } from '@/modules/cases/components/task-agenda';
import { addCasePerson, getCasePersons, getThirdParty, saveThirdParty } from '@/modules/cases/api/third-party-api';
import { listInsuranceCompanies, searchPersons } from '@/modules/cases/api/new-case-api';
import { requestJson } from '@/shared/api/http-client';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';

const numberOrNull = (value) => value === '' ? null : Number(value);
const formFrom = (data) => ({
  thirdPartyCompanyId: data?.thirdPartyCompanyId ? String(data.thirdPartyCompanyId) : '', claimReference: data?.claimReference ?? '',
  documentationStatusCode: data?.documentationStatusCode ?? 'PENDIENTE', documentationAccepted: Boolean(data?.documentationAccepted),
  partsProvisionModeCode: data?.partsProvisionModeCode ?? '', minimumLaborAmount: data?.minimumLaborAmount ?? '',
  minimumPartsAmount: data?.minimumPartsAmount ?? '', bestQuotationSubtotal: data?.bestQuotationSubtotal ?? '',
  finalPartsTotal: data?.finalPartsTotal ?? '', amountToBillCompany: data?.amountToBillCompany ?? '',
});

const Field = ({ label, children }) => <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"><span className="mb-1 block">{label}</span>{children}</label>;

export const ThirdPartyWorkshopEditor = ({ caseId, caseDetail, budget }) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(() => formFrom(null));
  const [acknowledged, setAcknowledged] = useState(false);
  const thirdPartyQuery = useQuery({ queryKey: ['cases', String(caseId), 'third-party'], queryFn: () => getThirdParty(caseId) });
  const catalogsQuery = useQuery({ queryKey: ['insurance', 'catalogs'], queryFn: () => requestJson('/insurance/catalogs') });
  const companiesQuery = useQuery({ queryKey: ['insurance', 'companies'], queryFn: listInsuranceCompanies });
  useEffect(() => { setForm(formFrom(thirdPartyQuery.data)); setAcknowledged(Boolean(thirdPartyQuery.data?.documentationAccepted)); }, [thirdPartyQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () => saveThirdParty(caseId, {
      ...form, thirdPartyCompanyId: form.thirdPartyCompanyId ? Number(form.thirdPartyCompanyId) : null,
      documentationAccepted: form.documentationAccepted, minimumLaborAmount: numberOrNull(form.minimumLaborAmount),
      minimumPartsAmount: numberOrNull(form.minimumPartsAmount), bestQuotationSubtotal: numberOrNull(form.bestQuotationSubtotal),
      finalPartsTotal: form.partsProvisionModeCode === 'TALLER' ? numberOrNull(form.finalPartsTotal) : null,
      amountToBillCompany: numberOrNull(form.amountToBillCompany), finalAmountForWorkshop: null,
    }),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'third-party'] }); await queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'workspace'] }); toast.success('Datos del reclamo guardados.'); },
    onError: (error) => toast.error(error.message || 'No se pudo guardar el reclamo.'),
  });
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const documentationStatuses = catalogsQuery.data?.thirdPartyDocumentationStatusCodes ?? [];
  const provisionModes = catalogsQuery.data?.partsProvisionModeCodes ?? [];
  const finalWorkshopAmount = thirdPartyQuery.data?.finalAmountForWorkshop;

  return <div className="mt-5 space-y-5 pb-20">
    <ClaimDataSection caseId={caseId} />
    <InvolvedThirdPartiesSection caseId={caseId} />
    <section className="rounded-3xl border border-border/70 bg-card p-5">
      <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Building2 className="h-5 w-5" /></div><h4 className="text-sm font-semibold">Reclamo ante tercero</h4></div><Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}><Save className="mr-1.5 h-3.5 w-3.5" />Guardar</Button></div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Field label="Compañía del tercero"><select value={form.thirdPartyCompanyId} onChange={(e) => set('thirdPartyCompanyId', e.target.value)} className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"><option value="">Seleccionar…</option>{(companiesQuery.data ?? []).map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></Field>
        <Field label="Referencia de reclamo"><Input value={form.claimReference} onChange={(e) => set('claimReference', e.target.value)} /></Field>
        <Field label="Documentación"><select value={form.documentationStatusCode} onChange={(e) => set('documentationStatusCode', e.target.value)} className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm">{documentationStatuses.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</select></Field>
        <label className="flex items-end gap-2 pb-2 text-sm"><input type="checkbox" checked={form.documentationAccepted} onChange={(event) => set('documentationAccepted', event.target.checked)} />Documentación completa</label>
        <Field label="Provee repuestos"><select value={form.partsProvisionModeCode} onChange={(e) => set('partsProvisionModeCode', e.target.value)} className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"><option value="">Seleccionar…</option>{provisionModes.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</select></Field>
        <Field label="Mínimo mano de obra"><Input type="number" min="0" value={form.minimumLaborAmount} onChange={(e) => set('minimumLaborAmount', e.target.value)} /></Field>
        <Field label="Mínimo repuestos"><Input type="number" min="0" value={form.minimumPartsAmount} onChange={(e) => set('minimumPartsAmount', e.target.value)} /></Field>
        <Field label="Subtotal mejor cotización"><Input type="number" min="0" value={form.bestQuotationSubtotal} onChange={(e) => set('bestQuotationSubtotal', e.target.value)} /></Field>
        {form.partsProvisionModeCode === 'TALLER' ? <Field label="Total final repuestos"><Input type="number" min="0" value={form.finalPartsTotal} onChange={(e) => set('finalPartsTotal', e.target.value)} /></Field> : null}
        <Field label="A facturar compañía"><Input type="number" min="0" value={form.amountToBillCompany} onChange={(e) => set('amountToBillCompany', e.target.value)} /></Field>
        <Field label="Final a favor taller"><Input readOnly value={finalWorkshopAmount ?? 'Se calcula al guardar'} className="cursor-not-allowed bg-muted/50" /></Field>
      </div>
      {budget ? <p className="mt-3 text-xs text-muted-foreground">El presupuesto cerrado y la gestión de pedidos determinan los mínimos y los repuestos definitivos.</p> : null}
    </section>
    <DocumentsSection caseId={caseId} />
    <ProcedureSection caseId={caseId} budget={budget} />
    <TaskAgenda caseId={caseId} organizationId={caseDetail?.organizationId} branchId={caseDetail?.branchId} />
    <Dialog open={!acknowledged && Boolean(thirdPartyQuery.data) && !thirdPartyQuery.data?.documentationAccepted} onClose={() => setAcknowledged(true)} title="Carpeta con documentación pendiente" description="La documentación del reclamo todavía no fue marcada como completa. Revisala antes de continuar."><Button className="w-full" onClick={() => setAcknowledged(true)}><AlertTriangle className="mr-2 h-4 w-4" />Aceptar</Button></Dialog>
  </div>;
};

const InvolvedThirdPartiesSection = ({ caseId }) => {
  const queryClient = useQueryClient(); const [search, setSearch] = useState(''); const [personId, setPersonId] = useState(''); const [kind, setKind] = useState('Conductor tercero'); const [ownership, setOwnership] = useState('100');
  const casePersonsQuery = useQuery({ queryKey: ['cases', String(caseId), 'persons'], queryFn: () => getCasePersons(caseId) });
  const peopleQuery = useQuery({ queryKey: ['persons', 'third-party-search', search], queryFn: () => searchPersons({ q: search }), enabled: search.trim().length >= 2 });
  const isThirdPartyOwner = kind === 'Titular registral tercero';
  const addMutation = useMutation({ mutationFn: () => addCasePerson(caseId, { personId: Number(personId), caseRoleCode: isThirdPartyOwner ? 'TITULAR' : 'TERCERO', vehicleId: null, isMain: false, notes: kind, porcentajeTitularidad: isThirdPartyOwner ? Number(ownership) : null }), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'persons'] }); setPersonId(''); setSearch(''); toast.success('Tercero incorporado.'); }, onError: (error) => toast.error(error.message || 'No se pudo agregar el tercero.') });
  const parties = (casePersonsQuery.data ?? []).filter((person) => person.caseRoleCode === 'TERCERO' || (person.caseRoleCode === 'TITULAR' && person.vehicleId == null));
  return <section className="rounded-3xl border border-border/70 bg-card p-5"><h4 className="text-sm font-semibold">Terceros involucrados</h4><p className="mt-1 text-xs text-muted-foreground">Registrá conductor, titular u otro tercero involucrado. Para varios titulares del tercero, cargá 50% a cada uno.</p><div className="relative mt-4 grid gap-3 md:grid-cols-[180px_1fr_auto_auto]"><select value={kind} onChange={(e) => setKind(e.target.value)} className="h-10 rounded-xl border border-input bg-background px-3 text-sm"><option>Conductor tercero</option><option>Titular registral tercero</option><option>Otro tercero</option></select>{isThirdPartyOwner ? <select value={ownership} onChange={(e) => setOwnership(e.target.value)} className="h-10 rounded-xl border border-input bg-background px-3 text-sm"><option value="100">100%</option><option value="50">50%</option></select> : null}<Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={personId ? `Persona #${personId} seleccionada` : 'Buscar persona por nombre o documento'} />{(peopleQuery.data ?? []).length ? <div className="absolute left-[180px] right-20 top-10 z-10 rounded-xl border border-border bg-card p-1 shadow-lg">{peopleQuery.data.map((person) => <button type="button" key={person.id} className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-muted" onClick={() => { setPersonId(String(person.id)); setSearch(''); }}>{person.nombreMostrar}</button>)}</div> : null}<Button size="sm" onClick={() => addMutation.mutate()} disabled={!personId || addMutation.isPending}>Agregar</Button></div>{parties.length ? <ul className="mt-4 space-y-1 text-sm text-muted-foreground">{parties.map((party) => <li key={party.id} className="rounded-xl bg-muted/40 px-3 py-2"><strong className="text-foreground">{party.displayName}</strong> · {party.notes || 'Tercero'}{party.registryOwnershipPercentage ? ` · ${party.registryOwnershipPercentage}%` : ''}</li>)}</ul> : null}</section>;
};
