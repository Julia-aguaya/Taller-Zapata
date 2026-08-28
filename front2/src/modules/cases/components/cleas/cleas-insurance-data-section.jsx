import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { getCleasInsurance, saveCleasInsurance } from '@/modules/cases/api/cleas-api';
import { requestJson } from '@/shared/api/http-client';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';

const Field = ({ label, children }) => <label className="min-w-0"><span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</span>{children}</label>;
const emptyInsurance = { insuranceCompanyId: '', thirdPartyCompanyId: '', policyNumber: '', certificateNumber: '', coverageDetail: '', cleasNumber: '', claimNumber: '', processorPersonId: '', inspectorPersonId: '' };

export const CleasInsuranceDataSection = ({ caseId, onHydrated, initialCleasNumber = '', onCleasNumberChange, onClaimNumberChange }) => {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState(emptyInsurance);
  const insuranceQuery = useQuery({ queryKey: ['cases', String(caseId), 'cleas', 'insurance'], queryFn: () => getCleasInsurance(caseId) });
  const companiesQuery = useQuery({ queryKey: ['insurance', 'companies'], queryFn: () => requestJson('/insurance/companies') });
  const contactsQuery = useQuery({ queryKey: ['insurance', 'company', draft.insuranceCompanyId, 'contacts'], queryFn: () => requestJson(`/insurance/companies/${draft.insuranceCompanyId}/contacts`), enabled: Boolean(draft.insuranceCompanyId) });

  useEffect(() => {
    if (!insuranceQuery.data) return;
    const next = Object.fromEntries(Object.keys(emptyInsurance).map((key) => [key, insuranceQuery.data[key] ?? '']));
    setDraft(next);
    onHydrated?.(insuranceQuery.data);
  }, [insuranceQuery.data]);

  const mutation = useMutation({
    mutationFn: () => {
      if (!draft.insuranceCompanyId) throw new Error('Seleccioná la compañía aseguradora del cliente.');
      return saveCleasInsurance(caseId, {
        insuranceCompanyId: Number(draft.insuranceCompanyId), policyNumber: draft.policyNumber || null, certificateNumber: draft.certificateNumber || null,
        coverageDetail: draft.coverageDetail || null, thirdPartyCompanyId: draft.thirdPartyCompanyId ? Number(draft.thirdPartyCompanyId) : null,
        cleasNumber: draft.cleasNumber || null, claimNumber: draft.claimNumber || null,
        processorPersonId: draft.processorPersonId ? Number(draft.processorPersonId) : null, inspectorPersonId: draft.inspectorPersonId ? Number(draft.inspectorPersonId) : null,
      });
    },
    onSuccess: async (saved) => { setDraft(Object.fromEntries(Object.keys(emptyInsurance).map((key) => [key, saved[key] ?? '']))); onHydrated?.(saved); await Promise.all([queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'cleas', 'insurance'] }), queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'workspace'] }), queryClient.invalidateQueries({ queryKey: ['cases'] })]); toast.success('Datos del seguro guardados.'); },
    onError: (error) => toast.error(error.message || 'No se pudo guardar el seguro.'),
  });
  const contacts = contactsQuery.data ?? [];
  const contactsFor = (role) => contacts.filter((contact) => contact.contactRoleCode === role);
  const change = (field) => (event) => { setDraft((current) => ({ ...current, [field]: event.target.value })); if (field === 'cleasNumber') onCleasNumberChange?.(event.target.value); if (field === 'claimNumber') onClaimNumberChange?.(event.target.value); };

  return <Card className="rounded-3xl border-border/70 p-5">
    <div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Building2 className="h-5 w-5" /></div><h4 className="text-sm font-semibold">Datos del seguro</h4></div><Button type="button" size="sm" onClick={() => mutation.mutate()} disabled={mutation.isPending}><Save className="mr-1.5 h-3.5 w-3.5" />Guardar</Button></div>
    <div className="mt-4 grid gap-x-6 gap-y-3 md:grid-cols-2"><Field label="Cía. aseguradora del cliente"><select value={draft.insuranceCompanyId} onChange={(event) => setDraft((current) => ({ ...current, insuranceCompanyId: event.target.value, processorPersonId: '', inspectorPersonId: '' }))} className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"><option value="">Seleccionar...</option>{(companiesQuery.data ?? []).map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></Field><Field label="N.º de siniestro"><Input value={draft.claimNumber} onChange={change('claimNumber')} /></Field><Field label="Cía. aseguradora del tercero"><select value={draft.thirdPartyCompanyId} onChange={change('thirdPartyCompanyId')} className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"><option value="">Sin informar</option>{(companiesQuery.data ?? []).map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></Field><Field label="N.º de CLEAS"><Input value={draft.cleasNumber || initialCleasNumber} onChange={change('cleasNumber')} /></Field><Field label="Tramitador/a"><select value={draft.processorPersonId} onChange={change('processorPersonId')} disabled={!draft.insuranceCompanyId} className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"><option value="">Sin informar</option>{contactsFor('TRAMITADOR').map((contact) => <option key={contact.id} value={contact.personId}>{contact.personName || `#${contact.personId}`}</option>)}</select></Field><Field label="Inspector/a"><select value={draft.inspectorPersonId} onChange={change('inspectorPersonId')} disabled={!draft.insuranceCompanyId} className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"><option value="">Sin informar</option>{contactsFor('INSPECTOR').map((contact) => <option key={contact.id} value={contact.personId}>{contact.personName || `#${contact.personId}`}</option>)}</select></Field><Field label="Póliza"><Input value={draft.policyNumber} onChange={change('policyNumber')} /></Field><Field label="Certificado"><Input value={draft.certificateNumber} onChange={change('certificateNumber')} /></Field><Field label="Detalle de cobertura" className="md:col-span-2"><Input value={draft.coverageDetail} onChange={change('coverageDetail')} /></Field></div>
  </Card>;
};
