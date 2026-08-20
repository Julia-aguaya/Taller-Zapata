import { AlertTriangle, ClipboardList } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Select } from '@/shared/ui/select';

const Field = ({ label, children, className = '' }) => (
  <label className={`min-w-0 ${className}`}>
    <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
    {children}
  </label>
);

const toAmount = (value) => Number(value) || 0;
const calculatedInputClass = 'cursor-not-allowed bg-muted/60 text-muted-foreground';

export const CleasProcedureSection = ({ cleasOver, opinion, values, onChange, cleasAgreedAmount, setCleasAgreedAmount }) => {
  const agreedAmount = toAmount(cleasAgreedAmount);
  const franchiseAmount = toAmount(values.franchiseAmount);
  const companyRequiredAmount = toAmount(values.companyRequiredAmount);
  const amountToBill = cleasOver === 'franchise' && opinion === 'unfavorable'
    ? agreedAmount - (franchiseAmount - companyRequiredAmount)
    : agreedAmount;
  const customerAmount = agreedAmount - amountToBill;
  const showFavorableAmounts = opinion === 'favorable';
  const showFranchiseDistribution = cleasOver === 'franchise' && opinion === 'unfavorable';

  return (
    <Card className="rounded-3xl border-border/70 p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <ClipboardList className="h-5 w-5" />
        </div>
        <h4 className="text-sm font-semibold">Tramitación</h4>
      </div>

      {opinion === 'pending' ? <div role="alert" className="mt-4 flex gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-300"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />No se puede avanzar hasta recibir el dictamen.</div> : null}
      {opinion === 'shared' ? <div role="alert" className="mt-4 flex gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-300"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />La regla de negocio para culpa compartida todavía debe definirse.</div> : null}
      {cleasOver === 'damage' && opinion === 'unfavorable' ? (
        <div role="alert" className="mt-4 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/60 dark:text-red-300 sm:flex-row sm:items-center sm:justify-between">
          <span>El dictamen fue en contra. El trámite CLEAS no puede continuar y el caso debe cerrarse.</span>
          <Button type="button" variant="destructive" disabled>Cerrar caso</Button>
        </div>
      ) : null}

      {cleasOver === 'damage' && opinion === 'favorable' ? (
        <>
          {/* Ajuste visual favorable-total: cambiá grid-cols, gap, order o spans de cada fila sin cambiar cálculos. */}
          <div className="mt-4 grid gap-x-6 gap-y-3 md:grid-cols-4">
            <Field label="Fecha presentado" className="md:col-span-2"><Input type="date" value={values.presentedAt} onChange={onChange('presentedAt')} /></Field>
            <Field label="Dictamen" className="md:col-span-2"><Input value="A favor" readOnly className={calculatedInputClass} /></Field>
            <Field label="Derivado a inspección" className="md:col-span-2"><Input type="date" value={values.inspectionForwardedAt} onChange={onChange('inspectionForwardedAt')} /></Field>
            <Field label="Modalidad" className="md:col-span-2"><Select value={values.modality} onChange={onChange('modality')}><option value="">Seleccionar...</option><option value="PRESENCIAL">Presencial</option><option value="FOTOS">Por fotos</option></Select></Field>
            <Field label="Mínimo para cierre" className="md:col-span-2"><Input type="number" min="0" value={values.minimumCloseAmount} onChange={onChange('minimumCloseAmount')} /></Field>
            <Field label="Lleva repuestos" className="md:col-span-2"><Select value={values.includesParts} onChange={onChange('includesParts')}><option value="">Seleccionar...</option><option value="SI">Sí</option><option value="NO">No</option></Select></Field>
            <Field label="Cotización"><Select value={values.quotation} onChange={onChange('quotation')}><option value="">Seleccionar...</option><option value="PENDIENTE">Pendiente</option><option value="RECIBIDA">Recibida</option><option value="APROBADA">Aprobada</option></Select></Field>
            <Field label="Fecha de cotización"><Input type="date" value={values.quotationDate} onChange={onChange('quotationDate')} /></Field>
            <Field label="Monto de cotización acordada"><Input type="number" min="0" value={cleasAgreedAmount} onChange={(event) => setCleasAgreedAmount(event.target.value)} /></Field>
            <Field label="Autorización de repuestos"><Select value={values.partsAuthorization} onChange={onChange('partsAuthorization')}><option value="">Seleccionar...</option><option value="PENDIENTE">Pendiente</option><option value="AUTORIZADA">Autorizada</option><option value="RECHAZADA">Rechazada</option></Select></Field>
            <Field label="A facturar Cía." className="md:col-span-2"><Input value={amountToBill} readOnly className={calculatedInputClass} /></Field>
            <Field label="Proveedor de repuestos" className="md:col-span-2"><Input value={values.partsProvider} onChange={onChange('partsProvider')} /></Field>
          </div>
        </>
      ) : (
        <>
          {/* Ajuste visual CLEAS: cambiá grid-cols, gap, order o tamaños de estos campos sin modificar lógica. */}
          <div className="mt-4 grid gap-x-6 gap-y-3 md:grid-cols-3">
            <Field label="Fecha presentado"><Input type="date" value={values.presentedAt} onChange={onChange('presentedAt')} /></Field>
            <Field label="Derivado a inspección"><Input type="date" value={values.inspectionForwardedAt} onChange={onChange('inspectionForwardedAt')} /></Field>
            <Field label="Modalidad"><Select value={values.modality} onChange={onChange('modality')}><option value="">Seleccionar...</option><option value="PRESENCIAL">Presencial</option><option value="FOTOS">Por fotos</option></Select></Field>
            <Field label="Dictamen"><Input value={opinion === 'pending' ? 'Pendiente' : opinion === 'favorable' ? 'A favor' : opinion === 'unfavorable' ? 'En contra' : 'Culpa compartida'} readOnly className={calculatedInputClass} /></Field>
            <Field label="Mínimo para cierre"><Input type="number" min="0" value={values.minimumCloseAmount} onChange={onChange('minimumCloseAmount')} /></Field>
            <Field label="Lleva repuestos"><Select value={values.includesParts} onChange={onChange('includesParts')}><option value="">Seleccionar...</option><option value="SI">Sí</option><option value="NO">No</option></Select></Field>
            <Field label="Cotización"><Select value={values.quotation} onChange={onChange('quotation')}><option value="">Seleccionar...</option><option value="PENDIENTE">Pendiente</option><option value="RECIBIDA">Recibida</option><option value="APROBADA">Aprobada</option></Select></Field>
            <Field label="Fecha de cotización"><Input type="date" value={values.quotationDate} onChange={onChange('quotationDate')} /></Field>
            <Field label="Proveedor de repuestos"><Input value={values.partsProvider} onChange={onChange('partsProvider')} /></Field>
            <Field label="Autorización de repuestos"><Select value={values.partsAuthorization} onChange={onChange('partsAuthorization')}><option value="">Seleccionar...</option><option value="PENDIENTE">Pendiente</option><option value="AUTORIZADA">Autorizada</option><option value="RECHAZADA">Rechazada</option></Select></Field>
          </div>

          {showFavorableAmounts ? (
        <div className="mt-5 rounded-2xl border border-primary/15 bg-primary/5 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Importes del dictamen</p>
          {/* Separado para que puedas mover estos importes sin alargar la tarjeta principal. */}
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {cleasOver === 'franchise' ? <Field label="Monto de franquicia"><Input type="number" min="0" value={values.franchiseAmount} onChange={onChange('franchiseAmount')} /></Field> : null}
            <Field label="Monto de cotización acordada"><Input type="number" min="0" value={cleasAgreedAmount} onChange={(event) => setCleasAgreedAmount(event.target.value)} /></Field>
            <Field label="A facturar Cía."><Input value={amountToBill} readOnly className={calculatedInputClass} /></Field>
          </div>
        </div>
          ) : null}

          {showFranchiseDistribution ? (
        <div className="mt-5 rounded-2xl border border-border/70 bg-muted/30 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Distribución de la franquicia</p>
          {/* Mantené esta subsección separada: acá podés cambiar columnas y campos calculados sin tocar la grilla común. */}
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <Field label="Monto de cotización acordada"><Input type="number" min="0" value={cleasAgreedAmount} onChange={(event) => setCleasAgreedAmount(event.target.value)} /></Field>
            <Field label="Monto de franquicia"><Input type="number" min="0" value={values.franchiseAmount} onChange={onChange('franchiseAmount')} /></Field>
            <Field label="Monto que la Cía. exige al cliente"><Input type="number" min="0" value={values.companyRequiredAmount} onChange={onChange('companyRequiredAmount')} /></Field>
            <Field label="A facturar Cía."><Input value={amountToBill} readOnly className={calculatedInputClass} /></Field>
            <Field label="A cargo del cliente"><Input value={customerAmount} readOnly className={calculatedInputClass} /></Field>
          </div>
          {amountToBill < 0 ? <div role="alert" className="mt-3 flex gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 dark:border-red-900 dark:bg-red-950/60 dark:text-red-300"><AlertTriangle className="h-4 w-4 shrink-0" />A facturar Cía. da negativo y requiere revisión.</div> : null}
        </div>
          ) : null}
        </>
      )}
    </Card>
  );
};
