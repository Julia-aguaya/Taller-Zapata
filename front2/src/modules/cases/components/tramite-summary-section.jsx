import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, Edit2, Save, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { requestJson } from '@/shared/api/http-client';
import { Button } from '@/shared/ui/button';

export const TramiteSummarySection = ({ caseId, caseTypeCode }) => {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [editIncidentDate, setEditIncidentDate] = useState('');
  const [editPrescriptionDate, setEditPrescriptionDate] = useState('');
  const [editPresentedAt, setEditPresentedAt] = useState('');
  const isTodoRiesgo = caseTypeCode === 'TODO_RIESGO';

  const incidentQuery = useQuery({ queryKey: ['cases', String(caseId), 'incident'], queryFn: () => requestJson(`/cases/${caseId}/incident`) });
  const processingQuery = useQuery({ queryKey: ['cases', String(caseId), 'insurance-processing'], queryFn: () => requestJson(`/cases/${caseId}/insurance-processing`) });

  const incident = incidentQuery.data;
  const processing = processingQuery.data;

  const mutation = useMutation({
    mutationFn: async () => {
      // Save incident if date changed
      if (editIncidentDate || (isTodoRiesgo && editPrescriptionDate)) {
        const incidentPayload = {
          incidentDate: editIncidentDate || null,
          incidentTime: incident?.incidentTime ?? null,
          location: incident?.location ?? null,
          dynamics: incident?.dynamics ?? null,
          observations: incident?.observations ?? null,
        };
        if (isTodoRiesgo) incidentPayload.prescriptionDate = editPrescriptionDate || null;
        await requestJson(`/cases/${caseId}/incident`, { method: 'PUT', body: JSON.stringify(incidentPayload) });
      }
      // Keep this cross-section edit partial so it cannot overwrite processing fields.
      if (editPresentedAt) {
        await requestJson(`/cases/${caseId}/insurance-processing`, { method: 'PATCH', body: JSON.stringify({
          expectedVersion: processing?.version ?? 0,
          presentedAt: editPresentedAt || null,
        })});
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'incident'] });
      await queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'insurance-processing'] });
      await queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'workspace'] });
      setEditing(false);
      toast.success('Datos guardados.');
    },
    onError: (e) => toast.error(e.message || 'Error al guardar.'),
  });

  const addYears = (dateStr, years) => {
    if (!dateStr) return '';
    const date = new Date(`${dateStr}T12:00:00`);
    date.setFullYear(date.getFullYear() + years);
    return date.toISOString().slice(0, 10);
  };

  const startEditing = () => {
    const incidentDate = incident?.incidentDate ?? '';
    setEditIncidentDate(incidentDate);
    setEditPrescriptionDate(isTodoRiesgo ? incident?.prescriptionDate ?? addYears(incidentDate, 1) : '');
    setEditPresentedAt(processing?.presentedAt ?? '');
    setEditing(true);
  };

  if (caseTypeCode === 'GRANIZO') {
    return (
      <div className="rounded-2xl border border-border/70 bg-card p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="min-w-0">
            <label htmlFor="granizo-incident-date" className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Fecha del hecho</label>
            <input id="granizo-incident-date" type="date" value={editIncidentDate || incident?.incidentDate || ''} required disabled={!editing} onChange={(event) => setEditIncidentDate(event.target.value)} className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm disabled:cursor-not-allowed disabled:bg-muted/60" />
          </div>
          <div className="min-w-0">
            <label htmlFor="granizo-prescription-date" className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Prescripción</label>
            <input id="granizo-prescription-date" type="date" value={incident?.prescriptionDate ?? ''} readOnly className="h-10 w-full cursor-not-allowed rounded-xl border border-input bg-muted/60 px-3 text-sm text-muted-foreground" />
          </div>
        </div>
        <div className="mt-3 flex justify-end gap-2">
          {editing ? <><Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancelar</Button><Button size="sm" onClick={() => mutation.mutate()} disabled={mutation.isPending}><Save className="mr-1.5 h-3.5 w-3.5" />Guardar fecha</Button></> : <Button size="sm" variant="outline" onClick={startEditing}><Edit2 className="mr-1.5 h-3.5 w-3.5" />Editar fecha</Button>}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-border/70 bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Calendar className="h-5 w-5" />
          </div>
          <h4 className="text-sm font-semibold">Datos generales del trámite</h4>
        </div>
        {!editing ? (
          <Button size="sm" variant="outline" onClick={startEditing}><Edit2 className="mr-1.5 h-3.5 w-3.5" />Editar</Button>
        ) : (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setEditing(false)}><X className="mr-1.5 h-3.5 w-3.5" />Cancelar</Button>
            <Button size="sm" onClick={() => mutation.mutate()} disabled={mutation.isPending}><Save className="mr-1.5 h-3.5 w-3.5" />Guardar</Button>
          </div>
        )}
      </div>

      <div className="mt-4 grid gap-x-6 gap-y-3 md:grid-cols-4">
        {/* Fecha del siniestro — editable */}
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Fecha del siniestro</p>
          {editing ? (
            <input type="date" value={editIncidentDate} onChange={(e) => { setEditIncidentDate(e.target.value); if (isTodoRiesgo) setEditPrescriptionDate(addYears(e.target.value, 1)); }}
              className="mt-0.5 h-9 w-full rounded-lg border border-input bg-background px-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" />
          ) : (
            <p className="mt-1 text-sm font-medium">{incident?.incidentDate ?? '—'}</p>
          )}
        </div>

        {/* Prescripción — editable */}
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Prescripción del trámite</p>
          {editing ? (
            <input type="date" value={isTodoRiesgo ? editPrescriptionDate : incident?.prescriptionDate ?? ''} readOnly
              className="mt-0.5 h-9 w-full rounded-lg border border-red-200 bg-muted/50 px-2 text-sm text-red-600 outline-none cursor-not-allowed" />
          ) : (
            <p className="mt-1 text-sm font-medium text-red-600 dark:text-red-400">{incident?.prescriptionDate ?? '—'}</p>
          )}
        </div>

        {/* Fecha presentado — editable */}
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Fecha presentado</p>
          {editing ? (
            <input type="date" value={editPresentedAt} onChange={(e) => setEditPresentedAt(e.target.value)}
              className="mt-0.5 h-9 w-full rounded-lg border border-input bg-background px-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" />
          ) : (
            <p className="mt-1 text-sm font-medium">{processing?.presentedAt ?? '—'}</p>
          )}
        </div>

        {/* Días tramitando — read-only */}
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Días tramitando</p>
          <p className="mt-1 text-sm font-medium">{incident?.daysInProcess != null ? incident.daysInProcess : '—'}</p>
        </div>
      </div>
    </div>
  );
};
