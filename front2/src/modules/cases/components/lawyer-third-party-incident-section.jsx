import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { getLawyerThirdPartyIncident, saveLawyerThirdPartyIncident } from '@/modules/cases/api/third-party-api';
import { requestJson } from '@/shared/api/http-client';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';

const emptyForm = {
  location: '', incidentTime: '', thirdPartyPlate: '', thirdPartyMake: '', thirdPartyModel: '', driverName: '', driverDni: '', driverAddress: '', driverIsOwner: '', ownerName: '', ownerDni: '', ownerAddress: '', ownershipPercentage: '', dynamics: '', observations: '',
};
const formFrom = (incident, thirdParty) => ({
  ...emptyForm,
  location: incident?.location ?? '', incidentTime: incident?.incidentTime ?? '', dynamics: incident?.dynamics ?? '', observations: incident?.observations ?? '',
  thirdPartyPlate: thirdParty?.thirdPartyPlate ?? '', thirdPartyMake: thirdParty?.thirdPartyMake ?? '', thirdPartyModel: thirdParty?.thirdPartyModel ?? '', driverName: thirdParty?.driverName ?? '', driverDni: thirdParty?.driverDni ?? '', driverAddress: thirdParty?.driverAddress ?? '', driverIsOwner: thirdParty?.driverIsOwner == null ? '' : thirdParty.driverIsOwner ? 'SI' : 'NO', ownerName: thirdParty?.ownerName ?? '', ownerDni: thirdParty?.ownerDni ?? '', ownerAddress: thirdParty?.ownerAddress ?? '', ownershipPercentage: thirdParty?.ownershipPercentage ?? '',
});
const Field = ({ label, children }) => <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"><span className="mb-1 block">{label}</span>{children}</label>;

export const LawyerThirdPartyIncidentSection = ({ caseId }) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const incidentQuery = useQuery({ queryKey: ['cases', String(caseId), 'incident'], queryFn: () => requestJson(`/cases/${caseId}/incident`) });
  const thirdPartyQuery = useQuery({ queryKey: ['cases', String(caseId), 'lawyer-third-party-incident'], queryFn: () => getLawyerThirdPartyIncident(caseId) });
  useEffect(() => { if (!incidentQuery.isLoading && !thirdPartyQuery.isLoading) setForm(formFrom(incidentQuery.data, thirdPartyQuery.data)); }, [incidentQuery.data, incidentQuery.isLoading, thirdPartyQuery.data, thirdPartyQuery.isLoading]);
  const mutation = useMutation({
    mutationFn: async () => {
      await requestJson(`/cases/${caseId}/incident`, { method: 'PUT', body: JSON.stringify({ incidentDate: incidentQuery.data?.incidentDate ?? null, location: form.location || null, incidentTime: form.incidentTime || null, dynamics: form.dynamics || null, observations: form.observations || null, prescriptionDate: incidentQuery.data?.prescriptionDate ?? null }) });
      return saveLawyerThirdPartyIncident(caseId, { thirdPartyPlate: form.thirdPartyPlate || null, thirdPartyMake: form.thirdPartyMake || null, thirdPartyModel: form.thirdPartyModel || null, driverName: form.driverName || null, driverDni: form.driverDni || null, driverAddress: form.driverAddress || null, driverIsOwner: form.driverIsOwner === '' ? null : form.driverIsOwner === 'SI', ownerName: form.ownerName || null, ownerDni: form.ownerDni || null, ownerAddress: form.ownerAddress || null, ownershipPercentage: form.ownershipPercentage === '' ? null : Number(form.ownershipPercentage) });
    },
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'incident'] }); await queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'lawyer-third-party-incident'] }); await queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'workspace'] }); toast.success('Siniestro guardado.'); },
    onError: (error) => toast.error(error.message || 'No se pudo guardar el siniestro.'),
  });
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  return <section className="rounded-3xl border border-border/70 bg-card p-5">
    <div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary"><ShieldAlert className="h-5 w-5" /></div><h4 className="text-sm font-semibold">Datos del siniestro</h4></div><Button size="sm" onClick={() => mutation.mutate()} disabled={mutation.isPending}><Save className="mr-1.5 h-3.5 w-3.5" />Guardar</Button></div>
    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      <Field label="Lugar de ocurrencia"><Input value={form.location} onChange={(event) => set('location', event.target.value)} /></Field>
      <Field label="Hora"><Input type="time" value={form.incidentTime} onChange={(event) => set('incidentTime', event.target.value)} /></Field>
      <Field label="Dominio del tercero"><Input value={form.thirdPartyPlate} onChange={(event) => set('thirdPartyPlate', event.target.value)} /></Field>
      <Field label="Marca"><Input value={form.thirdPartyMake} onChange={(event) => set('thirdPartyMake', event.target.value)} /></Field>
      <Field label="Modelo"><Input value={form.thirdPartyModel} onChange={(event) => set('thirdPartyModel', event.target.value)} /></Field>
      <Field label="Conductor/a del vehículo tercero"><Input value={form.driverName} onChange={(event) => set('driverName', event.target.value)} /></Field>
      <Field label="DNI"><Input value={form.driverDni} onChange={(event) => set('driverDni', event.target.value)} /></Field>
      <Field label="Domicilio"><Input value={form.driverAddress} onChange={(event) => set('driverAddress', event.target.value)} /></Field>
      <Field label="Es titular"><select aria-label="Es titular" value={form.driverIsOwner} onChange={(event) => set('driverIsOwner', event.target.value)} className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"><option value="">Seleccionar…</option><option value="SI">Sí</option><option value="NO">No</option></select></Field>
      <Field label="Titular del vehículo tercero"><Input value={form.ownerName} onChange={(event) => set('ownerName', event.target.value)} /></Field>
      <Field label="DNI"><Input value={form.ownerDni} onChange={(event) => set('ownerDni', event.target.value)} /></Field>
      <Field label="Domicilio"><Input value={form.ownerAddress} onChange={(event) => set('ownerAddress', event.target.value)} /></Field>
      <Field label="Porcentaje de titularidad"><Input type="number" min="0" max="100" value={form.ownershipPercentage} onChange={(event) => set('ownershipPercentage', event.target.value)} /></Field>
    </div>
    <div className="mt-3 space-y-3"><Field label="Dinámica"><Textarea value={form.dynamics} onChange={(event) => set('dynamics', event.target.value)} className="min-h-[80px] resize-y" /></Field><Field label="Observaciones"><Textarea value={form.observations} onChange={(event) => set('observations', event.target.value)} className="min-h-[80px] resize-y" /></Field></div>
  </section>;
};
