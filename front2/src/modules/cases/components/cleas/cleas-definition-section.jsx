import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save, Scale } from 'lucide-react';
import { toast } from 'sonner';
import { getCleasDefinition, saveCleasDefinition } from '@/modules/cases/api/cleas-api';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Select } from '@/shared/ui/select';

const Field = ({ label, children }) => <label className="min-w-0"><span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</span>{children}</label>;
const labels = { DANIO_TOTAL: 'Daño total', FRANQUICIA: 'Franquicia', PENDIENTE: 'Pendiente', A_FAVOR: 'A favor', EN_CONTRA: 'En contra', CULPA_COMPARTIDA: 'Culpa compartida' };

export const CleasDefinitionSection = ({ caseId, cleasOver, opinion, onCleasOverChange, onOpinionChange, onHydrated, readOnly = false }) => {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState({ scopeCode: 'DANIO_TOTAL', opinionCode: 'A_FAVOR' });
  const definitionQuery = useQuery({ queryKey: ['cases', String(caseId), 'cleas', 'definition'], queryFn: () => getCleasDefinition(caseId) });

  useEffect(() => {
    if (!definitionQuery.data) return;
    const next = { scopeCode: definitionQuery.data.scopeCode ?? 'DANIO_TOTAL', opinionCode: definitionQuery.data.opinionCode ?? 'A_FAVOR' };
    setDraft(next);
    onHydrated?.(next);
  }, [definitionQuery.data]);

  const mutation = useMutation({
    mutationFn: () => saveCleasDefinition(caseId, { ...definitionQuery.data, ...draft }),
    onSuccess: async (saved) => {
      setDraft({ scopeCode: saved.scopeCode, opinionCode: saved.opinionCode });
      onHydrated?.(saved);
      await Promise.all([queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'cleas', 'definition'] }), queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'workspace'] }), queryClient.invalidateQueries({ queryKey: ['cases'] })]);
      toast.success('Definición CLEAS guardada.');
    },
    onError: (error) => toast.error(error.message || 'No se pudo guardar la definición CLEAS.'),
  });

  const scopeCode = draft.scopeCode || (cleasOver === 'franchise' ? 'FRANQUICIA' : 'DANIO_TOTAL');
  const opinionCode = draft.opinionCode || ({ pending: 'PENDIENTE', unfavorable: 'EN_CONTRA', shared: 'CULPA_COMPARTIDA' }[opinion] ?? 'A_FAVOR');
  return <Card className="rounded-3xl border-border/70 p-5">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Scale className="h-5 w-5" /></div><h4 className="text-sm font-semibold">Definición del CLEAS</h4></div><div className="flex items-center gap-2"><Badge variant="outline">CLEAS sobre: {labels[scopeCode]}</Badge><Badge variant={opinionCode === 'EN_CONTRA' ? 'destructive' : opinionCode === 'A_FAVOR' ? 'success' : 'secondary'}>Dictamen: {labels[opinionCode]}</Badge><Button type="button" size="sm" onClick={() => mutation.mutate()} disabled={readOnly || mutation.isPending}><Save className="mr-1.5 h-3.5 w-3.5" />Guardar</Button></div></div>
    <div className="mt-4 grid gap-x-6 gap-y-3 md:grid-cols-2"><Field label="CLEAS sobre"><Select value={scopeCode} onChange={(event) => { setDraft((current) => ({ ...current, scopeCode: event.target.value })); onCleasOverChange?.(event.target.value === 'FRANQUICIA' ? 'franchise' : 'damage'); }} disabled={readOnly}><option value="DANIO_TOTAL">Daño total</option><option value="FRANQUICIA">Franquicia</option></Select></Field><Field label="Dictamen"><Select value={opinionCode} onChange={(event) => { setDraft((current) => ({ ...current, opinionCode: event.target.value })); onOpinionChange?.({ PENDIENTE: 'pending', A_FAVOR: 'favorable', EN_CONTRA: 'unfavorable', CULPA_COMPARTIDA: 'shared' }[event.target.value]); }} disabled={readOnly}><option value="PENDIENTE">Pendiente</option><option value="A_FAVOR">A favor</option><option value="EN_CONTRA">En contra</option><option value="CULPA_COMPARTIDA">Culpa compartida</option></Select></Field></div>
  </Card>;
};
