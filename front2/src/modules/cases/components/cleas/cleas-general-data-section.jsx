import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Edit2, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { getCleasIncident, getCleasProcessing, saveCleasIncident, saveCleasProcessing } from '@/modules/cases/api/cleas-api';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';

const emptyDates = { incidentDate: '', prescriptionDate: '', presentedAt: '' };

const prescriptionFromIncident = (incidentDate) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(incidentDate);
  if (!match) return '';
  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const nextYear = year + 1;
  const daysInIncidentMonth = month === 2 ? (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28) : [4, 6, 9, 11].includes(month) ? 30 : 31;
  if (month < 1 || month > 12 || day < 1 || day > daysInIncidentMonth) return '';
  const daysInPrescriptionMonth = month === 2 ? (nextYear % 4 === 0 && (nextYear % 100 !== 0 || nextYear % 400 === 0) ? 29 : 28) : [4, 6, 9, 11].includes(month) ? 30 : 31;
  return `${String(nextYear).padStart(4, '0')}-${monthText}-${String(Math.min(day, daysInPrescriptionMonth)).padStart(2, '0')}`;
};

const DateField = ({ label, value, editing, onChange, readOnly = false }) => <div className="min-w-0">
  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
  {editing ? <input aria-label={label} type="date" value={value} onChange={onChange} readOnly={readOnly} className="mt-0.5 h-9 w-full rounded-lg border border-input bg-background px-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" /> : <p className="mt-1 text-sm font-medium">{value || 'Sin informar'}</p>}
</div>;

export const CleasGeneralDataSection = ({ caseId, closed = false }) => {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(emptyDates);
  const incidentQuery = useQuery({ queryKey: ['cases', String(caseId), 'cleas', 'incident'], queryFn: () => getCleasIncident(caseId) });
  const processingQuery = useQuery({ queryKey: ['cases', String(caseId), 'cleas', 'processing'], queryFn: () => getCleasProcessing(caseId) });
  const incident = incidentQuery.data?.incident;
  const processing = processingQuery.data;

  const mutation = useMutation({
    mutationFn: async () => {
      const incidentChanged = draft.incidentDate !== (incident?.incidentDate ?? '') || draft.prescriptionDate !== (incident?.prescriptionDate ?? '');
      const presentedChanged = draft.presentedAt !== (processing?.presentedAt ?? '');
      if (incidentChanged) {
        await saveCleasIncident(caseId, {
          incident: { ...incident, incidentDate: draft.incidentDate || null, prescriptionDate: draft.prescriptionDate || null },
          thirdPartyPlate: incidentQuery.data?.thirdPartyPlate ?? null,
        });
      }
      if (presentedChanged) await saveCleasProcessing(caseId, { expectedVersion: processing?.version ?? 0, presentedAt: draft.presentedAt || null });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'cleas', 'incident'] }),
        queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'cleas', 'processing'] }),
        queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'workspace'] }),
        queryClient.invalidateQueries({ queryKey: ['cases'] }),
      ]);
      setEditing(false);
      toast.success('Datos generales CLEAS guardados.');
    },
    onError: (error) => toast.error(error?.httpStatus === 409 ? 'Los datos fueron modificados por otra persona. Recargá e intentá nuevamente.' : error.message || 'No se pudieron guardar los datos generales CLEAS.'),
  });

  const startEditing = () => {
    const incidentDate = incident?.incidentDate ?? '';
    setDraft({ incidentDate, prescriptionDate: prescriptionFromIncident(incidentDate), presentedAt: processing?.presentedAt ?? '' });
    setEditing(true);
  };

  return <Card className="rounded-3xl border-border/70 p-5">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary"><CalendarDays className="h-5 w-5" /></div><h4 className="text-sm font-semibold">Datos generales del trámite</h4></div>
      {!closed && (!editing ? <Button type="button" size="sm" variant="outline" onClick={startEditing}><Edit2 className="mr-1.5 h-3.5 w-3.5" />Editar</Button> : <div className="flex gap-2"><Button type="button" size="sm" variant="outline" onClick={() => setEditing(false)}><X className="mr-1.5 h-3.5 w-3.5" />Cancelar</Button><Button type="button" size="sm" onClick={() => mutation.mutate()} disabled={mutation.isPending}><Save className="mr-1.5 h-3.5 w-3.5" />Guardar</Button></div>)}
    </div>
    <div className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2 xl:grid-cols-4">
      <DateField label="Fecha del siniestro" value={editing ? draft.incidentDate : incident?.incidentDate ?? ''} editing={editing} onChange={(event) => setDraft((current) => ({ ...current, incidentDate: event.target.value, prescriptionDate: prescriptionFromIncident(event.target.value) }))} />
      <DateField label="Prescripción del trámite" value={editing ? draft.prescriptionDate : incident?.prescriptionDate ?? ''} editing={editing} readOnly />
      <DateField label="Fecha presentado" value={editing ? draft.presentedAt : processing?.presentedAt ?? ''} editing={editing} onChange={(event) => setDraft((current) => ({ ...current, presentedAt: event.target.value }))} />
      <div className="min-w-0"><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Días tramitando</p><p className="mt-1 text-sm font-medium">{incident?.daysInProcess ?? 'Sin informar'}</p></div>
    </div>
  </Card>;
};
