import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, ImagePlus, Pencil, Save, Store, X } from 'lucide-react';
import { toast } from 'sonner';
import { requestJson } from '@/shared/api/http-client';
import { useSession } from '@/modules/auth/providers/session-provider';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

const fetchOrganizations = () => requestJson('/organizations');
const fetchBranches = (orgId) => requestJson(`/branches?organizationId=${orgId}`);
const updateOrganization = (id, payload) => requestJson(`/organizations/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
const updateBranch = (id, payload) => requestJson(`/branches/${id}`, { method: 'PUT', body: JSON.stringify(payload) });

export const ManagementPage = () => {
  const queryClient = useQueryClient();
  const { session } = useSession();
  const scopes = session?.scopes ?? [];
  const firstOrgId = scopes[0]?.organizationId;

  const orgsQuery = useQuery({ queryKey: ['organizations'], queryFn: fetchOrganizations, enabled: Boolean(firstOrgId) });
  const [selectedOrgId] = useState(firstOrgId);
  const branchesQuery = useQuery({ queryKey: ['branches', selectedOrgId], queryFn: () => fetchBranches(selectedOrgId), enabled: Boolean(selectedOrgId) });

  const org = (orgsQuery.data ?? []).find((o) => o.id === selectedOrgId);
  const branches = branchesQuery.data ?? [];

  const [orgEditing, setOrgEditing] = useState(false);
  const [orgForm, setOrgForm] = useState({});
  const [branchEditing, setBranchEditing] = useState({});
  const [branchForms, setBranchForms] = useState({});

  useEffect(() => { if (org) setOrgForm({ name: org.name || '', razonSocial: org.razonSocial || '', cuit: org.cuit || '', condicionIva: org.condicionIva || '', phone: org.phone || '', email: org.email || '', logoDocumentId: org.logoDocumentId || null }); }, [org]);
  useEffect(() => {
    const forms = {};
    branches.forEach((b) => { forms[b.id] = { name: b.name || '', addressLine1: b.addressLine1 || '', city: b.city || '', province: b.province || '', phone: b.phone || '', email: b.email || '' }; });
    setBranchForms(forms);
  }, [branches]);

  const orgMutation = useMutation({
    mutationFn: () => updateOrganization(selectedOrgId, { ...orgForm, logoDocumentId: orgForm.logoDocumentId || null }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['organizations'] }); setOrgEditing(false); toast.success('Organización actualizada.'); },
    onError: (e) => toast.error(e.message),
  });

  const branchMutation = useMutation({
    mutationFn: ({ branchId, payload }) => updateBranch(branchId, payload),
    onSuccess: (_, vars) => { queryClient.invalidateQueries({ queryKey: ['branches', selectedOrgId] }); setBranchEditing((c) => ({ ...c, [vars.branchId]: false })); toast.success('Sucursal actualizada.'); },
    onError: (e) => toast.error(e.message),
  });

  const logoInputRef = useRef(null);
  const uploadLogoMutation = useMutation({
    mutationFn: async (file) => {
      const stored = JSON.parse(window.localStorage.getItem('front2.session.v1') || '{}');
      const form = new FormData(); form.append('file', file); form.append('categoryId', '4'); form.append('originCode', 'TALLER');
      const r = await fetch('/api/v1/documents', { method: 'POST', headers: { Authorization: `Bearer ${stored.accessToken}` }, body: form });
      if (!r.ok) throw new Error('Error al subir');
      return r.json();
    },
    onSuccess: (doc) => {
      setOrgForm((c) => ({ ...c, logoDocumentId: doc.id }));
      toast.success('Logo subido. Guardá los cambios para confirmar.');
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-5">
      <Card className="border-white/50 bg-card/90 p-6 shadow-haze">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Building2 className="h-5 w-5" /></div>
          <div><h2 className="text-2xl font-semibold tracking-tight">Gestión del taller</h2><p className="text-sm text-muted-foreground">Datos comerciales que aparecen en presupuestos y documentos.</p></div>
        </div>
      </Card>

      {org ? (
        <Card className="border-white/50 bg-card/90 p-6 shadow-haze">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" /><h3 className="text-xl font-semibold">Organización</h3></div>
            {orgEditing ? (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setOrgEditing(false); if (org) setOrgForm({ name: org.name || '', razonSocial: org.razonSocial || '', cuit: org.cuit || '', condicionIva: org.condicionIva || '', phone: org.phone || '', email: org.email || '', logoDocumentId: org.logoDocumentId || null }); }}><X className="mr-1 h-3.5 w-3.5" />Cancelar</Button>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => orgMutation.mutate()} disabled={orgMutation.isPending}><Save className="mr-1.5 h-4 w-4" />Guardar</Button>
              </div>
            ) : (
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setOrgEditing(true)}><Pencil className="mr-1.5 h-4 w-4" />Editar</Button>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <ViewField label="Nombre" value={orgForm.name} editing={orgEditing} onChange={(v) => setOrgForm((c) => ({ ...c, name: v }))} />
            <ViewField label="Razón social" value={orgForm.razonSocial} editing={orgEditing} onChange={(v) => setOrgForm((c) => ({ ...c, razonSocial: v }))} />
            <ViewField label="CUIT" value={orgForm.cuit} editing={orgEditing} onChange={(v) => setOrgForm((c) => ({ ...c, cuit: v }))} />
            <ViewField label="Cond. IVA" value={orgForm.condicionIva} editing={orgEditing} onChange={(v) => setOrgForm((c) => ({ ...c, condicionIva: v }))} />
            <ViewField label="Teléfono" value={orgForm.phone} editing={orgEditing} onChange={(v) => setOrgForm((c) => ({ ...c, phone: v }))} />
            <ViewField label="Email" value={orgForm.email} editing={orgEditing} onChange={(v) => setOrgForm((c) => ({ ...c, email: v }))} />
            <div className="space-y-1.5">
              <Label>Logo</Label>
              {orgEditing ? (
                <div className="flex items-center gap-3">
                  {orgForm.logoDocumentId ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Logo cargado</span>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setOrgForm((c) => ({ ...c, logoDocumentId: null }))}>Quitar</Button>
                    </div>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => logoInputRef.current?.click()}><ImagePlus className="mr-1.5 h-4 w-4" />Subir logo</Button>
                  )}
                </div>
              ) : (
                <p className="rounded-2xl border border-border/50 bg-background/50 px-4 py-3 text-sm">{orgForm.logoDocumentId ? 'Logo cargado' : '—'}</p>
              )}
            </div>
          </div>
          <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadLogoMutation.mutate(f); }} />
        </Card>
      ) : null}

      {branches.map((branch) => {
        const f = branchForms[branch.id] || {};
        const editing = branchEditing[branch.id] || false;
        return (
          <Card key={branch.id} className="border-white/50 bg-card/90 p-6 shadow-haze">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2"><Store className="h-5 w-5 text-primary" /><h3 className="text-xl font-semibold">Sucursal: {branch.code} — {branch.name}</h3></div>
              {editing ? (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setBranchEditing((c) => ({ ...c, [branch.id]: false })); const orig = branches.find((b) => b.id === branch.id); if (orig) setBranchForms((c) => ({ ...c, [branch.id]: { name: orig.name || '', addressLine1: orig.addressLine1 || '', city: orig.city || '', province: orig.province || '', phone: orig.phone || '', email: orig.email || '' } })); }}><X className="mr-1 h-3.5 w-3.5" />Cancelar</Button>
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => branchMutation.mutate({ branchId: branch.id, payload: f })} disabled={branchMutation.isPending}><Save className="mr-1.5 h-4 w-4" />Guardar</Button>
                </div>
              ) : (
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setBranchEditing((c) => ({ ...c, [branch.id]: true }))}><Pencil className="mr-1.5 h-4 w-4" />Editar</Button>
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <ViewField label="Nombre" value={f.name} editing={editing} onChange={(v) => setBranchForms((c) => ({ ...c, [branch.id]: { ...c[branch.id], name: v } }))} />
              <ViewField label="Dirección" value={f.addressLine1} editing={editing} onChange={(v) => setBranchForms((c) => ({ ...c, [branch.id]: { ...c[branch.id], addressLine1: v } }))} />
              <ViewField label="Ciudad" value={f.city} editing={editing} onChange={(v) => setBranchForms((c) => ({ ...c, [branch.id]: { ...c[branch.id], city: v } }))} />
              <ViewField label="Provincia" value={f.province} editing={editing} onChange={(v) => setBranchForms((c) => ({ ...c, [branch.id]: { ...c[branch.id], province: v } }))} />
              <ViewField label="Teléfono" value={f.phone} editing={editing} onChange={(v) => setBranchForms((c) => ({ ...c, [branch.id]: { ...c[branch.id], phone: v } }))} />
              <ViewField label="Email" value={f.email} editing={editing} onChange={(v) => setBranchForms((c) => ({ ...c, [branch.id]: { ...c[branch.id], email: v } }))} />
            </div>
          </Card>
        );
      })}
    </div>
  );
};

const ViewField = ({ label, value, editing, onChange }) => (
  <div className="space-y-1.5">
    <Label>{label}</Label>
    {editing ? (
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    ) : (
      <p className="rounded-2xl border border-border/50 bg-background/50 px-4 py-3 text-sm">{value || '—'}</p>
    )}
  </div>
);
