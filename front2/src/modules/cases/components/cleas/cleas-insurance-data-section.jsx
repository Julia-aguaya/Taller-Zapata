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
      {/* Contactos locales: la grilla conserva datos de cada rol sin persistirlos. */}
      <div className="rounded-2xl border border-border/60 bg-background/50 p-4 md:col-span-2">
        <p className="mb-3 text-xs font-semibold">Tramitador/a</p>
        <div className="grid gap-3 md:grid-cols-3"><Field label="Nombre"><Input value={values.processorName} onChange={onChange('processorName')} /></Field><Field label="Correo"><Input type="email" value={values.processorEmail} onChange={onChange('processorEmail')} /></Field><Field label="Teléfono"><Input type="tel" value={values.processorPhone} onChange={onChange('processorPhone')} /></Field></div>
      </div>
      <div className="rounded-2xl border border-border/60 bg-background/50 p-4 md:col-span-2">
        <p className="mb-3 text-xs font-semibold">Inspector/a</p>
        <div className="grid gap-3 md:grid-cols-3"><Field label="Nombre"><Input value={values.inspectorName} onChange={onChange('inspectorName')} /></Field><Field label="Correo"><Input type="email" value={values.inspectorEmail} onChange={onChange('inspectorEmail')} /></Field><Field label="Teléfono"><Input type="tel" value={values.inspectorPhone} onChange={onChange('inspectorPhone')} /></Field></div>
      </div>
    </div>
  </Card>
);
