import { ShieldAlert } from 'lucide-react';
import { Card } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';

const Field = ({ label, children, className = '' }) => (
  <label className={`min-w-0 ${className}`}>
    <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
    {children}
  </label>
);

export const CleasClaimDataSection = ({ values, onChange }) => (
  <Card className="rounded-3xl border-border/70 p-5">
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <ShieldAlert className="h-5 w-5" />
      </div>
      <h4 className="text-sm font-semibold">Datos del siniestro</h4>
    </div>

    {/* Ajuste visual CLEAS: cambiá grid-cols, gap, order o tamaños de esta grilla sin tocar otros tipos de trámite. */}
    <div className="mt-4 grid gap-x-6 gap-y-3 md:grid-cols-2">
      <Field label="Lugar de ocurrencia"><Input value={values.location} onChange={onChange('location')} /></Field>
      <Field label="Hora"><Input type="time" value={values.time} onChange={onChange('time')} /></Field>
      <Field label="Dominio del tercero"><Input value={values.thirdPartyPlate} onChange={onChange('thirdPartyPlate')} /></Field>
      <Field label="Dinámica del siniestro" className="md:col-span-2"><Textarea value={values.dynamics} onChange={onChange('dynamics')} className="min-h-24 resize-y" /></Field>
      <Field label="Observaciones" className="md:col-span-2"><Textarea value={values.observations} onChange={onChange('observations')} className="min-h-24 resize-y" /></Field>
    </div>
  </Card>
);
