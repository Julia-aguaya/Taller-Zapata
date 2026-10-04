import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import { toast } from 'sonner';
import { requestJson } from '@/shared/api/http-client';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

const Field = ({ label, children }) => <label className="block min-w-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"><span className="mb-1 block">{label}</span>{children}</label>;

const parseDate = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '');
  return match ? new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))) : null;
};

const formatDate = (date) => date.toISOString().slice(0, 10);

export const prescriptionFromIncident = (incidentDate) => {
  const date = parseDate(incidentDate);
  if (!date) return '';
  const targetYear = date.getUTCFullYear() + 3;
  const targetMonth = date.getUTCMonth();
  const targetDay = date.getUTCDate();
  const result = new Date(Date.UTC(targetYear, targetMonth, targetDay));
  if (result.getUTCMonth() !== targetMonth) result.setUTCDate(0);
  return formatDate(result);
};

export const daysSincePresentation = (presentedAt, now = new Date()) => {
  const presented = parseDate(presentedAt);
  if (!presented) return '';
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(0, Math.floor((today - presented.getTime()) / 86_400_000));
};

const CalculatedField = ({ label, value, fallback }) => <Field label={label}><Input aria-label={label} readOnly value={value === '' ? fallback : value} className="cursor-not-allowed bg-muted/50" /></Field>;

export const LawyerProcessingSection = ({ caseId }) => {
  const queryClient = useQueryClient();
  const incidentQuery = useQuery({ queryKey: ['cases', String(caseId), 'incident'], queryFn: () => requestJson(`/cases/${caseId}/incident`) });
  const processingQuery = useQuery({ queryKey: ['cases', String(caseId), 'insurance-processing'], queryFn: () => requestJson(`/cases/${caseId}/insurance-processing`) });
  const [incidentDate, setIncidentDate] = useState('');
  const [presentedAt, setPresentedAt] = useState('');
  const [opinionCode, setOpinionCode] = useState('APROBADO');

  useEffect(() => { setIncidentDate(incidentQuery.data?.incidentDate ?? ''); }, [incidentQuery.data]);
  useEffect(() => { setPresentedAt(processingQuery.data?.presentedAt ?? ''); setOpinionCode(processingQuery.data?.opinionCode ?? 'APROBADO'); }, [processingQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await requestJson(`/cases/${caseId}/incident`, { method: 'PUT', body: JSON.stringify({
        incidentDate: incidentDate || null,
        incidentTime: incidentQuery.data?.incidentTime ?? null,
        location: incidentQuery.data?.location ?? null,
        dynamics: incidentQuery.data?.dynamics ?? null,
        observations: incidentQuery.data?.observations ?? null,
      }) });
      return requestJson(`/cases/${caseId}/insurance-processing`, { method: 'PATCH', body: JSON.stringify({ expectedVersion: processingQuery.data?.version ?? 0, presentedAt: presentedAt || null, opinionCode }) });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'incident'] }),
        queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'insurance-processing'] }),
        queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'workspace'] }),
      ]);
      toast.success('Datos del trámite guardados.');
    },
    onError: (error) => toast.error(error.message || 'No se pudieron guardar los datos del trámite.'),
  });

  const prescriptionDate = prescriptionFromIncident(incidentDate);
  const daysInProcess = daysSincePresentation(presentedAt);
  return <section className="rounded-2xl border border-border/60 bg-background/70 p-5"><div className="flex items-center justify-between gap-3"><div><h4 className="font-semibold">Datos del trámite</h4><p className="text-xs text-muted-foreground">La prescripción se calcula desde la fecha del siniestro.</p></div><Button size="sm" type="button" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}><Save className="mr-1.5 h-3.5 w-3.5" />Guardar</Button></div><div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3"><Field label="Fecha del siniestro"><Input aria-label="Fecha del siniestro" type="date" value={incidentDate} onChange={(event) => setIncidentDate(event.target.value)} /></Field><Field label="Fecha presentado"><Input aria-label="Fecha presentado" type="date" value={presentedAt} onChange={(event) => setPresentedAt(event.target.value)} /></Field><CalculatedField label="Prescripción del trámite" value={prescriptionDate} fallback="Ingresá Fecha del siniestro" /><CalculatedField label="Días tramitando" value={daysInProcess} fallback="Ingresá Fecha presentado" /><Field label="Dictamen"><select aria-label="Dictamen" value={opinionCode} onChange={(event) => setOpinionCode(event.target.value)} className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"><option value="APROBADO">A favor</option><option value="RECHAZADO">En contra</option></select></Field></div></section>;
};
