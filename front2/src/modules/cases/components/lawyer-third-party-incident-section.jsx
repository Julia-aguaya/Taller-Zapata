import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Save, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { getCasePersons, getLawyerThirdPartyIncident, getThirdPartyWorkshop, saveLawyerThirdPartyIncident, saveThirdPartyWorkshop } from '@/modules/cases/api/third-party-api';
import { createVehicle } from '@/modules/cases/api/new-case-api';
import { requestJson } from '@/shared/api/http-client';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { LawyerAdditionalOwnerDialog } from './lawyer-additional-owner-dialog';

const emptyForm = { incidentDate: '', location: '', incidentTime: '', dynamics: '', observations: '', thirdPartyPlate: '', thirdPartyMake: '', thirdPartyModel: '', driverName: '', driverDni: '', driverAddress: '', driverIsOwner: '', ownerName: '', ownerDni: '', ownerAddress: '', ownershipPercentage: '' };
const Field = ({ label, children, className = '' }) => <label className={`block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground ${className}`}><span className="mb-1 block">{label}</span>{children}</label>;

const IncidentDetails = ({ form, set }) => <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
  <Field label="Lugar de ocurrencia"><Input value={form.location} onChange={(event) => set('location', event.target.value)} /></Field>
  <Field label="Hora"><Input type="time" value={form.incidentTime} onChange={(event) => set('incidentTime', event.target.value)} /></Field>
  <Field label="Dominio tercero"><Input value={form.thirdPartyPlate} onChange={(event) => set('thirdPartyPlate', event.target.value)} /></Field>
  <Field label="Marca"><Input value={form.thirdPartyMake} onChange={(event) => set('thirdPartyMake', event.target.value)} /></Field>
  <Field label="Modelo"><Input value={form.thirdPartyModel} onChange={(event) => set('thirdPartyModel', event.target.value)} /></Field>
  <Field label="Conductor/a vehículo tercero"><Input value={form.driverName} onChange={(event) => set('driverName', event.target.value)} /></Field>
  <Field label="DNI"><Input value={form.driverDni} onChange={(event) => set('driverDni', event.target.value)} /></Field>
  <Field label="Domicilio"><Input value={form.driverAddress} onChange={(event) => set('driverAddress', event.target.value)} /></Field>
  <Field label="Es titular"><select aria-label="Es titular" value={form.driverIsOwner} onChange={(event) => set('driverIsOwner', event.target.value)} className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"><option value="">Seleccionar…</option><option value="SI">Sí</option><option value="NO">No</option></select></Field>
  <Field label="Titular vehículo tercero"><Input value={form.ownerName} onChange={(event) => set('ownerName', event.target.value)} /></Field>
  <Field label="DNI"><Input value={form.ownerDni} onChange={(event) => set('ownerDni', event.target.value)} /></Field>
  <Field label="Domicilio"><Input value={form.ownerAddress} onChange={(event) => set('ownerAddress', event.target.value)} /></Field>
  <Field label="Porcentaje titularidad"><Input type="number" min="0" max="100" value={form.ownershipPercentage} onChange={(event) => set('ownershipPercentage', event.target.value)} /></Field>
</div>;

/** Lawyer claims retain their legacy incident record while extra registral owners use case-person relations. */
export const LawyerThirdPartyIncidentSection = ({ caseId }) => {
  const client = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [ownerDialogOpen, setOwnerDialogOpen] = useState(false);
  const incident = useQuery({ queryKey: ['cases', String(caseId), 'incident'], queryFn: () => requestJson(`/cases/${caseId}/incident`) });
  const lawyer = useQuery({ queryKey: ['cases', String(caseId), 'lawyer-third-party-incident'], queryFn: () => getLawyerThirdPartyIncident(caseId) });
  const workshop = useQuery({ queryKey: ['cases', String(caseId), 'third-party-workshop'], queryFn: () => getThirdPartyWorkshop(caseId) });
  const people = useQuery({ queryKey: ['cases', String(caseId), 'persons'], queryFn: () => getCasePersons(caseId) });

  useEffect(() => {
    if (!incident.isLoading && !lawyer.isLoading) setForm({ ...emptyForm, incidentDate: incident.data?.incidentDate ?? '', location: incident.data?.location ?? '', incidentTime: incident.data?.incidentTime ?? '', dynamics: incident.data?.dynamics ?? '', observations: incident.data?.observations ?? '', thirdPartyPlate: lawyer.data?.thirdPartyPlate ?? '', thirdPartyMake: lawyer.data?.thirdPartyMake ?? '', thirdPartyModel: lawyer.data?.thirdPartyModel ?? '', driverName: lawyer.data?.driverName ?? '', driverDni: lawyer.data?.driverDni ?? '', driverAddress: lawyer.data?.driverAddress ?? '', driverIsOwner: lawyer.data?.driverIsOwner == null ? '' : lawyer.data.driverIsOwner ? 'SI' : 'NO', ownerName: lawyer.data?.ownerName ?? '', ownerDni: lawyer.data?.ownerDni ?? '', ownerAddress: lawyer.data?.ownerAddress ?? '', ownershipPercentage: lawyer.data?.ownershipPercentage ?? '' });
  }, [incident.data, incident.isLoading, lawyer.data, lawyer.isLoading]);

  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const vehicleId = workshop.data?.thirdPartyVehicleId ?? null;
  const additionalOwners = (people.data ?? []).filter((person) => person.caseRoleCode === 'TITULAR' && person.vehicleId === vehicleId);
  const recordedPercentage = Number(form.ownershipPercentage) || 0;
  const remaining = Math.max(0, 100 - recordedPercentage - additionalOwners.reduce((total, owner) => total + Number(owner.registryOwnershipPercentage || 0), 0));
  const save = useMutation({
    mutationFn: async () => {
      await requestJson(`/cases/${caseId}/incident`, { method: 'PUT', body: JSON.stringify({ incidentDate: form.incidentDate || null, location: form.location || null, incidentTime: form.incidentTime || null, dynamics: form.dynamics || null, observations: form.observations || null, prescriptionDate: incident.data?.prescriptionDate ?? null }) });
      await saveLawyerThirdPartyIncident(caseId, { thirdPartyPlate: form.thirdPartyPlate || null, thirdPartyMake: form.thirdPartyMake || null, thirdPartyModel: form.thirdPartyModel || null, driverName: form.driverName || null, driverDni: form.driverDni || null, driverAddress: form.driverAddress || null, driverIsOwner: form.driverIsOwner === '' ? null : form.driverIsOwner === 'SI', ownerName: form.ownerName || null, ownerDni: form.ownerDni || null, ownerAddress: form.ownerAddress || null, ownershipPercentage: form.ownershipPercentage === '' ? null : Number(form.ownershipPercentage) });
      let savedVehicleId = vehicleId;
      if (!savedVehicleId && form.thirdPartyPlate.trim()) savedVehicleId = (await createVehicle({ brandId: null, modelId: null, brandText: form.thirdPartyMake || null, modelText: form.thirdPartyModel || null, plate: form.thirdPartyPlate.trim(), year: null, vehicleTypeCode: 'SEDAN', usageCode: 'PARTICULAR', color: null, paintCode: null, chasis: null, motor: null, transmissionCode: null, mileage: null, observaciones: null, activo: true })).id;
      if (savedVehicleId !== vehicleId) await saveThirdPartyWorkshop(caseId, { thirdPartyCompanyId: workshop.data?.thirdPartyCompanyId ?? null, claimReference: workshop.data?.claimReference ?? null, thirdPartyVehicleId: savedVehicleId, driverPersonId: workshop.data?.driverPersonId ?? null, processorPersonId: workshop.data?.processor?.personId ?? null, newProcessor: null, inspectorPersonId: workshop.data?.inspector?.personId ?? null, newInspector: null });
    },
    onSuccess: async () => { await Promise.all([client.invalidateQueries({ queryKey: ['cases', String(caseId), 'incident'] }), client.invalidateQueries({ queryKey: ['cases', String(caseId), 'lawyer-third-party-incident'] }), client.invalidateQueries({ queryKey: ['cases', String(caseId), 'third-party-workshop'] }), client.invalidateQueries({ queryKey: ['cases', String(caseId), 'workspace'] })]); toast.success('Siniestro guardado.'); },
    onError: (error) => toast.error(error.message || 'No se pudo guardar el siniestro.'),
  });

  return <section className="rounded-3xl border border-border/70 bg-card p-5">
    <div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary"><ShieldAlert className="h-5 w-5" /></div><h4 className="text-sm font-semibold">Datos del siniestro</h4></div><Button size="sm" onClick={() => save.mutate()} disabled={save.isPending}><Save className="mr-1.5 h-3.5 w-3.5" />Guardar</Button></div>
    <IncidentDetails form={form} set={set} />
    <div className="mt-4 border-t border-border/60 pt-4">
      <p className="text-sm font-medium">Titulares adicionales</p>
      {vehicleId && remaining > 0 ? <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-muted/40 p-3"><p className="text-xs text-muted-foreground">Titularidad restante: {remaining}%.</p><Button type="button" size="sm" onClick={() => setOwnerDialogOpen(true)}><Plus className="mr-1 h-3.5 w-3.5" />Agregar otro titular</Button></div> : <p className="mt-2 text-sm text-muted-foreground">Guardá primero un dominio y, si corresponde, una titularidad menor al 100% para agregar más titulares.</p>}
      {additionalOwners.map((owner) => <p key={owner.id} className="mt-2 text-sm">{owner.displayName}: {owner.registryOwnershipPercentage}%</p>)}
      <LawyerAdditionalOwnerDialog caseId={caseId} vehicleId={vehicleId} remaining={remaining} open={ownerDialogOpen} onClose={() => setOwnerDialogOpen(false)} onLinked={() => client.invalidateQueries({ queryKey: ['cases', String(caseId), 'persons'] })} />
    </div>
    <div className="mt-4 grid gap-3"><Field label="Dinámica"><Textarea value={form.dynamics} onChange={(event) => set('dynamics', event.target.value)} className="min-h-[80px] resize-y" /></Field><Field label="Observaciones"><Textarea value={form.observations} onChange={(event) => set('observations', event.target.value)} className="min-h-[80px] resize-y" /></Field></div>
  </section>;
};
