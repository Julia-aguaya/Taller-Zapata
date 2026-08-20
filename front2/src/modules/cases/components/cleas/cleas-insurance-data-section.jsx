import { Building2 } from 'lucide-react';
import { Card } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';

const Field = ({ label, children }) => (
  <label className="min-w-0">
    <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
    {children}
  </label>
);

export const CleasInsuranceDataSection = ({ values, onChange, nroCleas, setNroCleas }) => (
  <Card className="rounded-3xl border-border/70 p-5">
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Building2 className="h-5 w-5" />
      </div>
      <h4 className="text-sm font-semibold">Datos del seguro</h4>
    </div>

    {/* Ajuste visual CLEAS: cambiá grid-cols, gap, order o tamaños de estos Field sin modificar su estado local. */}
    <div className="mt-4 grid gap-x-6 gap-y-3 md:grid-cols-2">
      <Field label="Cía. aseguradora del cliente"><Input value={values.clientCompany} onChange={onChange('clientCompany')} /></Field>
      <Field label="N.º de siniestro"><Input value={values.claimNumber} onChange={onChange('claimNumber')} /></Field>
      <Field label="Cía. aseguradora del tercero"><Input value={values.thirdPartyCompany} onChange={onChange('thirdPartyCompany')} /></Field>
      <Field label="N.º de CLEAS"><Input value={nroCleas} onChange={(event) => setNroCleas(event.target.value)} /></Field>
      <Field label="Tramitador/a"><Input value={values.processor} onChange={onChange('processor')} /></Field>
      <Field label="Inspector/a"><Input value={values.inspector} onChange={onChange('inspector')} /></Field>
    </div>
  </Card>
);
