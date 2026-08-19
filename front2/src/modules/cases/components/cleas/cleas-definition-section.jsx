import { Scale } from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import { Card } from '@/shared/ui/card';
import { Select } from '@/shared/ui/select';

const Field = ({ label, children }) => (
  <label className="min-w-0">
    <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
    {children}
  </label>
);

const labels = {
  damage: 'Daño total',
  franchise: 'Franquicia',
  pending: 'Pendiente',
  favorable: 'A favor',
  unfavorable: 'En contra',
  shared: 'Culpa compartida',
};

export const CleasDefinitionSection = ({ cleasOver, opinion, onCleasOverChange, onOpinionChange }) => (
  <Card className="rounded-3xl border-border/70 p-5">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Scale className="h-5 w-5" />
        </div>
        <h4 className="text-sm font-semibold">Definición del CLEAS</h4>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">CLEAS sobre: {labels[cleasOver]}</Badge>
        <Badge variant={opinion === 'unfavorable' ? 'destructive' : opinion === 'favorable' ? 'success' : 'secondary'}>
          Dictamen: {labels[opinion]}
        </Badge>
      </div>
    </div>

    {/* Cambiá md:grid-cols-2, gap o el orden para reorganizar esta definición sin tocar Todo Riesgo. */}
    <div className="mt-4 grid gap-x-6 gap-y-3 md:grid-cols-2">
      <Field label="CLEAS sobre">
        <Select value={cleasOver} onChange={(event) => onCleasOverChange(event.target.value)}>
          <option value="damage">Daño total</option>
          <option value="franchise">Franquicia</option>
        </Select>
      </Field>
      <Field label="Dictamen">
        <Select value={opinion} onChange={(event) => onOpinionChange(event.target.value)}>
          <option value="pending">Pendiente</option>
          <option value="favorable">A favor</option>
          <option value="unfavorable">En contra</option>
          <option value="shared">Culpa compartida</option>
        </Select>
      </Field>
    </div>
  </Card>
);
