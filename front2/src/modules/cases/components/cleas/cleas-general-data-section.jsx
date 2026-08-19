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

    {/* Cambiá md:grid-cols-3, gap o el orden de estos bloques para ajustar la vista CLEAS. */}
    <div className="mt-4 grid gap-x-6 gap-y-3 md:grid-cols-3">
      <SummaryValue label="Carpeta" value={caseDetail?.folderCode} />
      <SummaryValue label="Cliente" value={caseDetail?.principalCustomerName} />
      <SummaryValue label="Dominio" value={caseDetail?.principalVehiclePlate} />
    </div>
  </Card>
);
