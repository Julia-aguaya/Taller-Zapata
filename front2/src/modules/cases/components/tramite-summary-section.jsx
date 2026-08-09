import { useQuery } from '@tanstack/react-query';
import { requestJson } from '@/shared/api/http-client';

const DATE_FMT = new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });

const ReadOnlyField = ({ label, value, highlight }) => (
  <div className="min-w-0">
    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
    <p className={`mt-0.5 text-sm font-medium truncate ${highlight ? 'text-red-600 dark:text-red-400' : ''}`}>{value ?? '—'}</p>
  </div>
);

export const TramiteSummarySection = ({ caseId }) => {
  const incidentQuery = useQuery({
    queryKey: ['cases', String(caseId), 'incident'],
    queryFn: () => requestJson(`/cases/${caseId}/incident`),
  });
  const insuranceProcessingQuery = useQuery({
    queryKey: ['cases', String(caseId), 'insurance-processing'],
    queryFn: () => requestJson(`/cases/${caseId}/insurance-processing`),
  });

  const incident = incidentQuery.data;
  const processing = insuranceProcessingQuery.data;

  return (
    <div className="rounded-3xl border border-border/70 bg-card p-5">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
      </div>
      <h4 className="mb-3 text-sm font-semibold">Datos generales del trámite</h4>
      <div className="grid gap-x-6 gap-y-3 md:grid-cols-4">
        <ReadOnlyField label="Fecha del siniestro" value={incident?.incidentDate ?? '—'} />
        <ReadOnlyField label="Prescripción del trámite" value={incident?.prescriptionDate ?? '—'} highlight />
        <ReadOnlyField label="Fecha presentado" value={processing?.presentedAt ?? '—'} />
        <ReadOnlyField label="Días tramitando" value={incident?.daysInProcess != null ? String(incident.daysInProcess) : '—'} />
      </div>
    </div>
  );
};
