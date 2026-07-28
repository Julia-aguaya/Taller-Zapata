import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, ImagePlus, Pencil, Save, Store, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import { requestJson } from '@/shared/api/http-client';
import { useSession } from '@/modules/auth/providers/session-provider';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

const fetchOrganizations = () => requestJson('/organizations');
const fetchBranches = (orgId) => requestJson(`/branches?organizationId=${orgId}`);
const updateOrganization = (id, payload) => requestJson(`/organizations/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
const updateBranch = (id, payload) => requestJson(`/branches/${id}`, { method: 'PUT', body: JSON.stringify(payload) });

const createOrgForm = (org) => ({
  name: org?.name || '',
  razonSocial: org?.razonSocial || '',
  cuit: org?.cuit || '',
  condicionIva: org?.condicionIva || '',
  phone: org?.phone || '',
  email: org?.email || '',
  logoDocumentId: org?.logoDocumentId || null,
});

const createBranchForm = (branch) => ({
  name: branch?.name || '',
  addressLine1: branch?.addressLine1 || '',
  city: branch?.city || '',
  province: branch?.province || '',
  phone: branch?.phone || '',
  email: branch?.email || '',
});

export const ManagementPage = () => {
  const queryClient = useQueryClient();
  const { session } = useSession();
  const scopes = session?.scopes ?? [];
  const firstOrgId = scopes[0]?.organizationId;

  const [selectedOrgId] = useState(firstOrgId);
  const [orgEditing, setOrgEditing] = useState(false);
  const [orgForm, setOrgForm] = useState(createOrgForm(null));
  const [branchEditing, setBranchEditing] = useState({});
  const [branchForms, setBranchForms] = useState({});
  const logoInputRef = useRef(null);

  const orgsQuery = useQuery({ queryKey: ['organizations'], queryFn: fetchOrganizations, enabled: Boolean(firstOrgId) });
  const branchesQuery = useQuery({ queryKey: ['branches', selectedOrgId], queryFn: () => fetchBranches(selectedOrgId), enabled: Boolean(selectedOrgId) });

  const org = (orgsQuery.data ?? []).find((item) => item.id === selectedOrgId);
  const branches = branchesQuery.data ?? [];

  useEffect(() => {
    if (org) {
      setOrgForm(createOrgForm(org));
    }
  }, [org]);

  useEffect(() => {
    const nextForms = {};
    branches.forEach((branch) => {
      nextForms[branch.id] = createBranchForm(branch);
    });
    setBranchForms(nextForms);
  }, [branches]);

  const orgMutation = useMutation({
    mutationFn: () => updateOrganization(selectedOrgId, { ...orgForm, logoDocumentId: orgForm.logoDocumentId || null }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['organizations'] });
      setOrgEditing(false);
      toast.success('Datos del taller actualizados.');
    },
    onError: (error) => toast.error(error.message || 'No pude actualizar la organización.'),
  });

  const branchMutation = useMutation({
    mutationFn: ({ branchId, payload }) => updateBranch(branchId, payload),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['branches', selectedOrgId] });
      setBranchEditing((current) => ({ ...current, [variables.branchId]: false }));
      toast.success('Sucursal actualizada.');
    },
    onError: (error) => toast.error(error.message || 'No pude actualizar la sucursal.'),
  });

  const uploadLogoMutation = useMutation({
    mutationFn: async (file) => {
      const stored = JSON.parse(window.localStorage.getItem('front2.session.v1') || '{}');
      const form = new FormData();
      form.append('file', file);
      form.append('categoryId', '4');
      form.append('originCode', 'TALLER');
      const response = await fetch('/api/v1/documents', { method: 'POST', headers: { Authorization: `Bearer ${stored.accessToken}` }, body: form });
      if (!response.ok) throw new Error('No pude subir el logo.');
      return response.json();
    },
    onSuccess: (documentPayload) => {
      setOrgForm((current) => ({ ...current, logoDocumentId: documentPayload.id }));
      toast.success('Logo subido. Guardá para confirmar el cambio.');
    },
    onError: (error) => toast.error(error.message || 'No pude subir el logo.'),
  });

  return (
    <div className="space-y-5">
      <Card className="border-white/60 bg-card/95 p-5 shadow-haze sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Gestión · Administración</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Taller y sucursales</h2>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Vista compacta de lectura. La edición se habilita solo al presionar Editar y reutiliza los endpoints reales de organización y sucursales.
            </p>
          </div>
          <Badge variant="outline">Lectura compacta + edición explícita</Badge>
        </div>
      </Card>

      {org ? (
        <Card className="border-white/60 bg-card/95 p-5 shadow-haze">
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Datos del taller</p>
                  <h3 className="text-2xl font-semibold tracking-tight">{orgForm.name || 'Organización'}</h3>
                </div>
              </div>
            </div>

            {orgEditing ? (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { setOrgEditing(false); setOrgForm(createOrgForm(org)); }}>
                  <Undo2 className="mr-2 h-4 w-4" />Cancelar
                </Button>
                <Button onClick={() => orgMutation.mutate()} disabled={orgMutation.isPending}>
                  <Save className="mr-2 h-4 w-4" />Guardar
                </Button>
              </div>
            ) : (
              <Button variant="outline" onClick={() => setOrgEditing(true)}>
                <Pencil className="mr-2 h-4 w-4" />Editar
              </Button>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <Field label="Nombre comercial" value={orgForm.name} disabled={!orgEditing} onChange={(value) => setOrgForm((current) => ({ ...current, name: value }))} />
            <Field label="Razón social" value={orgForm.razonSocial} disabled={!orgEditing} onChange={(value) => setOrgForm((current) => ({ ...current, razonSocial: value }))} />
            <Field label="CUIT" value={orgForm.cuit} disabled={!orgEditing} onChange={(value) => setOrgForm((current) => ({ ...current, cuit: value }))} />
            <Field label="Condición IVA" value={orgForm.condicionIva} disabled={!orgEditing} onChange={(value) => setOrgForm((current) => ({ ...current, condicionIva: value }))} />
            <Field label="Teléfono" value={orgForm.phone} disabled={!orgEditing} onChange={(value) => setOrgForm((current) => ({ ...current, phone: value }))} />
            <Field label="Email" value={orgForm.email} disabled={!orgEditing} type="email" onChange={(value) => setOrgForm((current) => ({ ...current, email: value }))} />
            <div className="rounded-3xl border border-border/60 bg-background/70 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Logo</p>
              {orgEditing ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => logoInputRef.current?.click()} disabled={uploadLogoMutation.isPending}>
                    <ImagePlus className="mr-2 h-4 w-4" />{orgForm.logoDocumentId ? 'Reemplazar logo' : 'Subir logo'}
                  </Button>
                  {orgForm.logoDocumentId ? (
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setOrgForm((current) => ({ ...current, logoDocumentId: null }))}>
                      Quitar
                    </Button>
                  ) : null}
                </div>
              ) : (
                <p className="mt-2 text-sm text-foreground">{orgForm.logoDocumentId ? 'Logo cargado' : 'Sin logo cargado'}</p>
              )}
            </div>
          </div>

          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) uploadLogoMutation.mutate(file);
            }}
          />
        </Card>
      ) : null}

      <Card className="border-white/60 bg-card/95 p-5 shadow-haze">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Sucursales</p>
            <h3 className="text-2xl font-semibold tracking-tight">Estructura operativa</h3>
          </div>
          <Badge variant="outline">{branches.length} sucursales</Badge>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {branches.map((branch) => {
            const editing = branchEditing[branch.id] || false;
            const branchForm = branchForms[branch.id] || createBranchForm(branch);

            return (
              <Card key={branch.id} className="border-border/60 bg-background/70 p-5 shadow-none">
                <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Store className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Sucursal {branch.code}</p>
                      <h4 className="text-xl font-semibold tracking-tight">{branch.name}</h4>
                    </div>
                  </div>

                  {editing ? (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setBranchEditing((current) => ({ ...current, [branch.id]: false }));
                          setBranchForms((current) => ({ ...current, [branch.id]: createBranchForm(branch) }));
                        }}
                      >
                        <Undo2 className="mr-2 h-4 w-4" />Cancelar
                      </Button>
                      <Button size="sm" onClick={() => branchMutation.mutate({ branchId: branch.id, payload: branchForm })} disabled={branchMutation.isPending}>
                        <Save className="mr-2 h-4 w-4" />Guardar
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setBranchEditing((current) => ({ ...current, [branch.id]: true }))}>
                      <Pencil className="mr-2 h-4 w-4" />Editar
                    </Button>
                  )}
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Nombre" value={branchForm.name} disabled={!editing} onChange={(value) => setBranchForms((current) => ({ ...current, [branch.id]: { ...current[branch.id], name: value } }))} />
                  <Field label="Dirección" value={branchForm.addressLine1} disabled={!editing} onChange={(value) => setBranchForms((current) => ({ ...current, [branch.id]: { ...current[branch.id], addressLine1: value } }))} />
                  <Field label="Ciudad" value={branchForm.city} disabled={!editing} onChange={(value) => setBranchForms((current) => ({ ...current, [branch.id]: { ...current[branch.id], city: value } }))} />
                  <Field label="Provincia" value={branchForm.province} disabled={!editing} onChange={(value) => setBranchForms((current) => ({ ...current, [branch.id]: { ...current[branch.id], province: value } }))} />
                  <Field label="Teléfono" value={branchForm.phone} disabled={!editing} onChange={(value) => setBranchForms((current) => ({ ...current, [branch.id]: { ...current[branch.id], phone: value } }))} />
                  <Field label="Email" value={branchForm.email} disabled={!editing} type="email" onChange={(value) => setBranchForms((current) => ({ ...current, [branch.id]: { ...current[branch.id], email: value } }))} />
                </div>
              </Card>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

const Field = ({ label, value, onChange, disabled, type = 'text' }) => (
  <label className="space-y-2">
    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
    {disabled ? (
      <p className="rounded-2xl border border-border/50 bg-background/50 px-4 py-3 text-sm text-foreground">{value || '—'}</p>
    ) : (
      <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    )}
  </label>
);
