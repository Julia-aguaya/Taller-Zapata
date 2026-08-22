import { CalendarDays } from 'lucide-react';
import { Card } from '@/shared/ui/card';

const SummaryValue = ({ label, value }) => (
  <div className="min-w-0">
    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
    <p className="mt-1 truncate text-sm font-medium">{value || 'Sin informar'}</p>
  </div>
);

export const CleasGeneralDataSection = ({ caseDetail }) => (
  <Card className="rounded-3xl border-border/70 p-5">
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <CalendarDays className="h-5 w-5" />
      </div>
      <h4 className="text-sm font-semibold">Datos generales del trámite</h4>
    </div>

    {/* Ajuste visual CLEAS: cambiá grid-cols, gap, order o tamaños de estos bloques sin modificar lógica. */}
    <div className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2 xl:grid-cols-4">
      <SummaryValue label="Fecha del siniestro" value={caseDetail?.incidentDate} />
      <SummaryValue label="Prescripción del trámite" value={caseDetail?.prescriptionDate} />
      <SummaryValue label="Fecha presentado" value={caseDetail?.presentedAt} />
      <SummaryValue label="Días tramitando" value={caseDetail?.daysInProcess} />
    </div>
  </Card>
);
