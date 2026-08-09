import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { requestJson } from '@/shared/api/http-client';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

const Field = ({ label, children, className = '' }) => (
  <div className={`min-w-0 ${className}`}>
    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</label>
    {children}
  </div>
);

export const InsuranceDataSection = ({ caseId, caseDetail }) => {
  const queryClient = useQueryClient();

  const insuranceQuery = useQuery({ queryKey: ['cases', String(caseId), 'insurance'], queryFn: () => requestJson(`/cases/${caseId}/insurance`) });
  const companiesQuery = useQuery({ queryKey: ['insurance', 'companies'], queryFn: () => requestJson('/insurance/companies') });

  const insurance = insuranceQuery.data;
  const companies = companiesQuery.data ?? [];

  const mutation = useMutation({
    mutationFn: (payload) => requestJson(`/cases/${caseId}/insurance`, { method: 'PUT', body: JSON.stringify(payload) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'insurance'] }); toast.success('Seguro guardado.'); },
    onError: (e) => toast.error(e.message),
  });

  const handleSave = () => {
    const form = document.getElementById('insurance-form');
    const fd = new FormData(form);
    const insuranceCompanyId = fd.get('insuranceCompanyId');
    if (!insuranceCompanyId) { toast.error('Seleccioná una compañía.'); return; }
    mutation.mutate({
      insuranceCompanyId: Number(insuranceCompanyId),
      policyNumber: fd.get('policyNumber') || null,
      certificateNumber: fd.get('certificateNumber') || null,
      claimNumber: fd.get('claimNumber') || null,
      coverageDetail: fd.get('coverageDetail') || null,
      processorCasePersonId: insurance?.processorCasePersonId ?? null,
      inspectorCasePersonId: insurance?.inspectorCasePersonId ?? null,
    });
  };

  return (
    <div className="rounded-3xl border border-border/70 bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Building2 className="h-5 w-5" />
          </div>
          <h4 className="text-sm font-semibold">Datos del seguro</h4>
        </div>
        <Button size="sm" onClick={handleSave} disabled={mutation.isPending}><Save className="mr-1.5 h-3.5 w-3.5" />Guardar</Button>
      </div>

      <form id="insurance-form" className="mt-4 grid gap-x-6 gap-y-3 md:grid-cols-2">
        <Field label="Cía. aseguradora">
          <select name="insuranceCompanyId" defaultValue={insurance?.insuranceCompanyId ?? ''} className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20">
            <option value="">Seleccionar...</option>
            {companies.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
          </select>
        </Field>
        <Field label="N° de Siniestro">
          <Input name="claimNumber" defaultValue={insurance?.claimNumber ?? ''} placeholder="Ej: 4-2541587" />
        </Field>
        <Field label="N° de póliza">
          <Input name="policyNumber" defaultValue={insurance?.policyNumber ?? ''} placeholder="Número de póliza" />
        </Field>
        <Field label="N° de certificado">
          <Input name="certificateNumber" defaultValue={insurance?.certificateNumber ?? ''} placeholder="Número de certificado" />
        </Field>
        <Field label="Detalle de la cobertura" className="md:col-span-2">
          <Input name="coverageDetail" defaultValue={insurance?.coverageDetail ?? ''} placeholder="Ej: Cobertura para luneta y equipo de GNC hasta $500 mil" />
        </Field>
      </form>
    </div>
  );
};
