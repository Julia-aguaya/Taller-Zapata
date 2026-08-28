import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { getCleasIncident, saveCleasIncident } from '@/modules/cases/api/cleas-api';
import { searchVehicles } from '@/modules/cases/api/new-case-api';
import { requestJson } from '@/shared/api/http-client';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';

const Field = ({ label, children, className = '' }) => <label className={`min-w-0 ${className}`}><span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</span>{children}</label>;
const emptyIncident = { incidentDate: '', incidentTime: '', location: '', dynamics: '', observations: '', prescriptionDate: '', thirdPartyVehicleId: '', vehicleSearch: '' };

export const CleasClaimDataSection = ({ caseId }) => {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState(emptyIncident);
  const incidentQuery = useQuery({ queryKey: ['cases', String(caseId), 'cleas', 'incident'], queryFn: () => getCleasIncident(caseId) });
  const vehicleQuery = useQuery({ queryKey: ['vehicles', 'search', draft.vehicleSearch], queryFn: () => searchVehicles({ q: draft.vehicleSearch }), enabled: draft.vehicleSearch.trim().length >= 2 });
  const selectedVehicleQuery = useQuery({ queryKey: ['vehicles', 'cleas-third-party', draft.thirdPartyVehicleId], queryFn: () => requestJson(`/vehicles/${draft.thirdPartyVehicleId}`), enabled: Boolean(draft.thirdPartyVehicleId) });

  useEffect(() => {
    if (!incidentQuery.data) return;
    setDraft({ ...emptyIncident, ...incidentQuery.data.incident, thirdPartyVehicleId: incidentQuery.data.thirdPartyVehicleId ?? '' });
  }, [incidentQuery.data]);

  const mutation = useMutation({
    mutationFn: () => saveCleasIncident(caseId, { incident: { incidentDate: draft.incidentDate || null, incidentTime: draft.incidentTime || null, location: draft.location || null, dynamics: draft.dynamics || null, observations: draft.observations || null, prescriptionDate: draft.prescriptionDate || null }, thirdPartyVehicleId: draft.thirdPartyVehicleId ? Number(draft.thirdPartyVehicleId) : null }),
    onSuccess: async () => { await Promise.all([queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'cleas', 'incident'] }), queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'workspace'] }), queryClient.invalidateQueries({ queryKey: ['cases'] })]); toast.success('Datos del siniestro guardados.'); },
    onError: (error) => toast.error(error.message || 'No se pudo guardar el siniestro.'),
  });
  const change = (field) => (event) => setDraft((current) => ({ ...current, [field]: event.target.value }));
  const vehicles = vehicleQuery.data ?? [];
  const selectedVehicle = selectedVehicleQuery.data;

  return <Card className="rounded-3xl border-border/70 p-5"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary"><ShieldAlert className="h-5 w-5" /></div><h4 className="text-sm font-semibold">Datos del siniestro</h4></div><Button type="button" size="sm" onClick={() => mutation.mutate()} disabled={mutation.isPending}><Save className="mr-1.5 h-3.5 w-3.5" />Guardar</Button></div><div className="mt-4 grid gap-x-6 gap-y-3 md:grid-cols-2"><Field label="Fecha del siniestro"><Input type="date" value={draft.incidentDate} onChange={change('incidentDate')} /></Field><Field label="Hora"><Input type="time" value={draft.incidentTime} onChange={change('incidentTime')} /></Field><Field label="Lugar de ocurrencia"><Input value={draft.location} onChange={change('location')} /></Field><Field label="Buscar vehículo tercero"><Input value={draft.vehicleSearch} onChange={change('vehicleSearch')} placeholder="Patente, marca o modelo" /></Field>{vehicles.length ? <Field label="Vehículo tercero" className="md:col-span-2"><select value={draft.thirdPartyVehicleId} onChange={change('thirdPartyVehicleId')} className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"><option value="">Sin informar</option>{vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.plate || 'Sin patente'} · {vehicle.brandText || ''} {vehicle.modelText || ''}</option>)}</select></Field> : selectedVehicle ? <Field label="Vehículo tercero" className="md:col-span-2"><p className="h-10 rounded-xl border border-input px-3 py-2 text-sm">{selectedVehicle.plate || `Vehículo #${selectedVehicle.id}`}</p></Field> : null}<Field label="Dinámica del siniestro" className="md:col-span-2"><Textarea value={draft.dynamics} onChange={change('dynamics')} className="min-h-24 resize-y" /></Field><Field label="Observaciones" className="md:col-span-2"><Textarea value={draft.observations} onChange={change('observations')} className="min-h-24 resize-y" /></Field></div></Card>;
};
