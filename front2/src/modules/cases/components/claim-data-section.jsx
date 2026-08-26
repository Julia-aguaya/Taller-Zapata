import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { requestJson } from '@/shared/api/http-client';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';

const Field = ({ label, children, className = '' }) => (
  <div className={`min-w-0 ${className}`}>
    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</label>
    {children}
  </div>
);

export const ClaimDataSection = ({ caseId }) => {
  const queryClient = useQueryClient();

  const incidentQuery = useQuery({ queryKey: ['cases', String(caseId), 'incident'], queryFn: () => requestJson(`/cases/${caseId}/incident`) });
  const incident = incidentQuery.data;

  const mutation = useMutation({
    mutationFn: (payload) => requestJson(`/cases/${caseId}/incident`, { method: 'PUT', body: JSON.stringify(payload) }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'incident'] });
      await queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'workspace'] });
      toast.success('Siniestro guardado.');
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSave = () => {
    const form = document.getElementById('claim-form');
    const fd = new FormData(form);
    mutation.mutate({
      incidentDate: incident?.incidentDate ?? null,
      incidentTime: fd.get('incidentTime') || null,
      location: fd.get('location') || null,
      dynamics: fd.get('dynamics') || null,
      observations: incident?.observations ?? null,
    });
  };

  return (
    <div className="rounded-3xl border border-border/70 bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <h4 className="text-sm font-semibold">Datos del siniestro</h4>
        </div>
        <Button size="sm" onClick={handleSave} disabled={mutation.isPending}><Save className="mr-1.5 h-3.5 w-3.5" />Guardar</Button>
      </div>

      <form id="claim-form" key={incident?.location ?? 'new'} className="mt-4 space-y-3">
        <div className="grid gap-x-6 gap-y-3 md:grid-cols-2">
          <Field label="Lugar de ocurrencia">
            <Input name="location" defaultValue={incident?.location ?? ''} placeholder="Ej: Mitre 400, Rosario" />
          </Field>
          <Field label="Hora">
            <Input type="time" name="incidentTime" defaultValue={incident?.incidentTime ?? ''} />
          </Field>
        </div>
        <Field label="Dinámica del siniestro">
          <Textarea name="dynamics" defaultValue={incident?.dynamics ?? ''} placeholder="Describí cómo ocurrió el siniestro..." className="min-h-[80px] resize-y" />
        </Field>
      </form>
    </div>
  );
};
