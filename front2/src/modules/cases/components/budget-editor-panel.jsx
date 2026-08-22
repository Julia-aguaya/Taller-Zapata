import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, FileDown, ImagePlus, Plus, Save, ShieldCheck, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { closeCaseBudget, createCaseBudgetItem, updateCaseBudgetItem, upsertCaseBudget } from '@/modules/cases/api/budget-api';
import { getBudgetCatalogs } from '@/modules/cases/api/budget-catalogs-api';
import { requestJson } from '@/shared/api/http-client';
import { useSession } from '@/modules/auth/providers/session-provider';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { ProviderSelector, providerPayload } from '@/modules/cases/components/provider-selector';
import { getAccessoryWorkTotals } from '@/modules/cases/lib/accessory-work-total';

const currency = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 2 });
const fmt = (v) => (v == null ? '-' : currency.format(v));
const yesNoAV = ['NO', 'SI', 'A/V'];

const createEmptyItem = (visualOrder = 1, defaults = {}) => ({
  id: null, visualOrder, affectedPiece: '', taskCode: 'CHAPA',
  damageLevelCode: defaults.damageLevelCode || '', partDecisionCode: defaults.partDecisionCode || '',
  actionCode: defaults.actionCode || '', requiresReplacement: false,
  partValue: '0', estimatedHours: '0', laborAmount: '0', active: true,
});

const toItemState = (item) => ({
  id: item.id, visualOrder: item.visualOrder, affectedPiece: item.affectedPiece || '',
  taskCode: item.taskCode || 'CHAPA', damageLevelCode: item.damageLevelCode || 'LEVE',
  partDecisionCode: item.partDecisionCode || 'REPARAR', actionCode: item.actionCode || 'REPARAR',
  requiresReplacement: Boolean(item.requiresReplacement),
  partValue: item.partValue?.toString?.() || '0', estimatedHours: item.estimatedHours?.toString?.() || '0',
  laborAmount: item.laborAmount?.toString?.() || '0', active: item.active ?? true,
});

const toDecimal = (v) => { const p = Number(v); return Number.isFinite(p) ? p : 0; };

export const BudgetEditorPanel = ({ caseId, budget, caseDetail, workshopInfo, accessoryUi, onAccessoryUiChange, onAddAccessoryWork, onSaved }) => {
  const queryClient = useQueryClient();
  const { session } = useSession();
  const catalogsQuery = useQuery({ queryKey: ['budget', 'catalogs'], queryFn: getBudgetCatalogs });
  const taskOptions = catalogsQuery.data?.taskCodes ?? [];
  const damageOptions = catalogsQuery.data?.damageLevelCodes ?? [];
  const decisionOptions = catalogsQuery.data?.partDecisionCodes ?? [];
  const actionOptions = catalogsQuery.data?.actionCodes ?? [];

  const defaults = useMemo(() => ({
    taskCode: taskOptions[0]?.code || '', damageLevelCode: damageOptions[0]?.code || '',
    partDecisionCode: decisionOptions[0]?.code || '', actionCode: actionOptions[0]?.code || '',
  }), [actionOptions, damageOptions, decisionOptions, taskOptions]);

  const toHeaderState = useMemo(() => (budget) => ({
    budgetDate: budget?.budgetDate || new Date().toISOString().slice(0, 10),
    laborWithoutVat: budget?.laborWithoutVat?.toString?.() || '0',
    partsTotal: budget?.partsTotal?.toString?.() || '0',
    estimatedDays: budget?.estimatedDays?.toString?.() || '3',
    minimumCloseAmount: budget?.minimumCloseAmount?.toString?.() || '0',
    observations: budget?.observations || '',
    authorizedByName: budget?.authorizedByName || session?.user?.displayName || '',
    interestedName: budget?.interestedName || caseDetail?.principalCustomerName || '',
    benchStraighteningApplies: budget?.benchStraighteningApplies ? 'SI' : 'NO',
    benchStraighteningDetail: budget?.benchStraighteningDetail || '',
    alignmentApplies: budget?.alignmentApplies ? 'SI' : 'NO',
    alignmentDetail: budget?.alignmentDetail || '',
    balancingApplies: budget?.balancingApplies ? 'SI' : 'NO',
    balancingDetail: budget?.balancingDetail || '',
    glassReplacementApplies: budget?.glassReplacementApplies ? 'SI' : 'NO',
    glassReplacementDetail: budget?.glassReplacementDetail || '',
    electricalWorkApplies: budget?.electricalWorkApplies ? 'SI' : 'NO',
    electricalDetail: budget?.electricalDetail || '',
    mechanicalWorkApplies: budget?.mechanicalWorkApplies ? 'SI' : 'NO',
    mechanicalWorkCode: budget?.mechanicalWorkCode || '',
    quotedPartsDate: budget?.quotedPartsDate || new Date().toISOString().slice(0, 10),
    quotedPartsSupplier: budget?.quotedPartsSupplier || '',
    providerId: budget?.providerId || null,
  }), [session, caseDetail]);

  const [header, setHeader] = useState(() => toHeaderState(budget));
  const [items, setItems] = useState(() => (budget?.items?.length ? budget.items.map(toItemState) : [createEmptyItem(1, defaults)]));

  useEffect(() => { setHeader(toHeaderState(budget)); setItems(budget?.items?.length ? budget.items.map(toItemState) : [createEmptyItem(1, defaults)]); }, [budget, defaults, toHeaderState]);

  const normalizedItems = useMemo(() => items.map((item, index) => ({ ...item, visualOrder: index + 1 })), [items]);
  const incompleteLines = useMemo(() => normalizedItems.filter((i) => !i.affectedPiece?.trim() || !i.actionCode?.trim() || !i.damageLevelCode?.trim()), [normalizedItems]);
  const hasIncompleteLines = incompleteLines.length > 0;
  const lastLineIncomplete = items.length > 0 && incompleteLines.some((i) => i.visualOrder === items.length);

  const partsSum = normalizedItems.reduce((s, i) => s + toDecimal(i.partValue), 0);
  const laborWithoutVat = toDecimal(header.laborWithoutVat);
  const laborWithVat = laborWithoutVat * 1.21;
  const showAccessoryBlock = Boolean(caseDetail?.caseTypeCode) && caseDetail.caseTypeCode !== 'PARTICULAR';
  const accessoryWorks = accessoryUi?.enabled === 'SI' ? accessoryUi.works ?? [] : [];
  const accessoryTotals = getAccessoryWorkTotals(accessoryUi);
  const updateAccessoryUi = (updater) => onAccessoryUiChange?.((current) => typeof updater === 'function' ? updater(current) : updater);

  const invalidateWorkspace = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['cases'] }),
      queryClient.invalidateQueries({ queryKey: ['cases', String(caseId)] }),
      queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'workspace'] }),
      queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'parts'] }),
      queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'insurance-processing'] }),
      queryClient.invalidateQueries({ queryKey: ['panel'] }),
    ]);
    await onSaved?.();
  };

  const saveMutation = useMutation({
    mutationFn: async ({ closeAfterSave = false }) => {
      await upsertCaseBudget(caseId, {
        budgetDate: header.budgetDate, reportStatusCode: closeAfterSave ? 'CERRADO' : 'BORRADOR',
        laborWithoutVat, vatRate: null, partsTotal: partsSum,
        estimatedDays: Number.parseInt(header.estimatedDays || '0', 10) || 0,
        minimumCloseAmount: toDecimal(header.minimumCloseAmount), observations: header.observations || null,
        authorizedByName: header.authorizedByName || null, interestedName: header.interestedName || null,
        benchStraighteningApplies: header.benchStraighteningApplies === 'SI', benchStraighteningDetail: header.benchStraighteningDetail || null,
        alignmentApplies: header.alignmentApplies === 'SI', alignmentDetail: header.alignmentDetail || null,
        balancingApplies: header.balancingApplies === 'SI', balancingDetail: header.balancingDetail || null,
        glassReplacementApplies: header.glassReplacementApplies === 'SI', glassReplacementDetail: header.glassReplacementDetail || null,
        electricalWorkApplies: header.electricalWorkApplies === 'SI', electricalDetail: header.electricalDetail || null,
        mechanicalWorkApplies: header.mechanicalWorkApplies === 'SI', mechanicalWorkCode: header.mechanicalWorkCode || null,
        quotedPartsDate: header.quotedPartsDate || null, quotedPartsSupplier: header.quotedPartsSupplier || null, providerId: header.providerId,
      });
      for (const item of normalizedItems) {
        const p = { visualOrder: item.visualOrder, affectedPiece: item.affectedPiece, taskCode: item.taskCode, damageLevelCode: item.damageLevelCode, partDecisionCode: item.partDecisionCode, actionCode: item.actionCode, requiresReplacement: item.requiresReplacement, partValue: toDecimal(item.partValue), estimatedHours: toDecimal(item.estimatedHours), laborAmount: toDecimal(item.laborAmount), active: item.active };
        if (item.id) await updateCaseBudgetItem(caseId, item.id, p); else await createCaseBudgetItem(caseId, p);
      }
      if (closeAfterSave) await closeCaseBudget(caseId, { reportStatusCode: 'CERRADO', observations: header.observations || null });
    },
    onSuccess: async (_, variables) => { await invalidateWorkspace(); toast.success(variables.closeAfterSave ? 'Presupuesto cerrado.' : 'Presupuesto guardado.'); },
    onError: (error) => toast.error(error.message || 'No pude guardar.'),
  });

  const guardedSave = (closeAfterSave) => {
    if (hasIncompleteLines) { toast.error(`${incompleteLines.length} línea(s) incompleta(s).`); return; }
    if (closeAfterSave && caseDetail && !caseDetail.principalVehiclePlate?.trim()) { toast.error('Completá la patente en Ficha Técnica.'); return; }
    saveMutation.mutate({ closeAfterSave });
  };

  // Documents
  const photoInputRef = useRef(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const docsQuery = useQuery({
    queryKey: ['cases', caseId, 'documents'],
    queryFn: async () => {
      const rels = await requestJson(`/cases/${caseId}/documents`);
      const stored = JSON.parse(window.localStorage.getItem('front2.session.v1') || '{}');
      const docs = await Promise.all(rels.map(async (rel) => {
        try {
          const doc = await requestJson(`/documents/${rel.documentId}`);
          let blobUrl = null;
          if (doc.mimeType?.startsWith('image/') || doc.mimeType?.startsWith('video/')) {
            const resp = await fetch(`/api/v1/cases/${caseId}/documents/${doc.id}/download`, { headers: { Authorization: `Bearer ${stored.accessToken}` } });
            if (resp.ok) { const blob = await resp.blob(); blobUrl = URL.createObjectURL(blob); }
          }
          return { ...doc, relationId: rel.id, blobUrl };
        } catch { return null; }
      }));
      return docs.filter(Boolean);
    },
  });
  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      const stored = JSON.parse(window.localStorage.getItem('front2.session.v1') || '{}');
      const form = new FormData(); form.append('file', file); form.append('categoryId', '2'); form.append('originCode', 'TALLER'); form.append('observations', file.name);
      const r = await fetch('/api/v1/documents', { method: 'POST', headers: { Authorization: `Bearer ${stored.accessToken}` }, body: form });
      if (!r.ok) throw new Error('Error al subir');
      const doc = await r.json();
      await requestJson(`/documents/${doc.id}/relations`, { method: 'POST', body: JSON.stringify({ caseId: Number(caseId), entityType: 'CASO', entityId: Number(caseId), moduleCode: 'OPERACION', principal: false, visibleToCustomer: false, visualOrder: 0 }) });
      return doc;
    },
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['cases', caseId, 'documents'] }); toast.success('Subido.'); },
    onError: (error) => toast.error(error.message),
  });
  const deleteDocMutation = useMutation({
    mutationFn: (docId) => requestJson(`/documents/${docId}`, { method: 'DELETE' }),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['cases', caseId, 'documents'] }); toast.success('Eliminado.'); },
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="mt-5 space-y-5">
      {/* Barra superior */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-card px-4 py-2 text-sm font-medium">{workshopInfo?.branchName || 'Taller Zapata'}</div>
        {budget?.reportStatusCode === 'CERRADO' ? (
            <Button className="bg-emerald-600 hover:bg-emerald-700" size="sm" onClick={async () => { const stored = JSON.parse(window.localStorage.getItem('front2.session.v1') || '{}'); const r = await fetch(`/api/v1/cases/${caseId}/budget/pdf`, { headers: { Authorization: `Bearer ${stored.accessToken}` } }); if (!r.ok) return toast.error('No se pudo descargar.'); const b = await r.blob(); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = `presupuesto-${caseId}.pdf`; a.click(); URL.revokeObjectURL(u); }}><FileDown className="mr-1.5 h-4 w-4" />Descargar PDF</Button>
        ) : null}
        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={() => guardedSave(false)} disabled={saveMutation.isPending}><Save className="mr-1.5 h-4 w-4" />Guardar cambios</Button>
          <Button onClick={() => guardedSave(true)} disabled={saveMutation.isPending}><ShieldCheck className="mr-1.5 h-4 w-4" />Generar presupuesto</Button>
        </div>
      </div>

      {hasIncompleteLines ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
          ⚠️ {incompleteLines.length} línea(s) sin pieza, acción o daño.
        </div>
      ) : null}

      {/* Membrete */}
      <div className="rounded-2xl border border-border/60 bg-card p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-3">
          <div><h3 className="text-lg font-bold tracking-tight">{workshopInfo?.razonSocial || workshopInfo?.organizationName || 'Taller Zapata'}</h3><p className="text-xs text-muted-foreground">Mecánica, chapería & pintura</p></div>
          <span className="text-sm font-medium">{caseDetail?.folderCode} — {caseDetail?.principalCustomerName}</span>
        </div>
        <div className="grid gap-x-4 gap-y-2 text-sm md:grid-cols-2 xl:grid-cols-4">
          <span><span className="text-muted-foreground">CUIT:</span> {workshopInfo?.cuit || '—'}</span>
          <span><span className="text-muted-foreground">IVA:</span> {workshopInfo?.condicionIva || '—'}</span>
          <span><span className="text-muted-foreground">Dirección:</span> {workshopInfo?.addressLine1 || '—'}{workshopInfo?.city ? `, ${workshopInfo.city}` : ''}</span>
          <span><span className="text-muted-foreground">Tel:</span> {workshopInfo?.phone || '—'}</span>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <div className="space-y-1"><Label className="text-xs">Fecha presupuesto</Label><Input type="date" value={header.budgetDate} onChange={(e) => setHeader((c) => ({ ...c, budgetDate: e.target.value }))} /></div>
          <div className="space-y-1"><Label className="text-xs">Autorizó</Label><Input value={header.authorizedByName} onChange={(e) => setHeader((c) => ({ ...c, authorizedByName: e.target.value }))} /></div>
          <div className="space-y-1"><Label className="text-xs">Interesado</Label><Input value={header.interestedName} onChange={(e) => setHeader((c) => ({ ...c, interestedName: e.target.value }))} /></div>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Pieza afectada</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Acción a ejecutar</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Nivel de daño</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Decisión</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">$ Repuestos</th>
                <th className="w-10 px-2 py-3" />
              </tr>
            </thead>
            <tbody>
              {normalizedItems.map((item, index) => (
                <tr key={`${item.id || 'new'}-${index}`} className="border-t border-border/40 hover:bg-accent/20">
                  <td className="px-4 py-2"><Input className="h-10 rounded-xl text-sm" value={item.affectedPiece} onChange={(e) => updateItem(setItems, index, 'affectedPiece', e.target.value)} placeholder="Ej: Guardabarros del. der." /></td>
                  <td className="px-4 py-2"><select className="h-10 w-full min-w-[130px] rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary" value={item.actionCode} onChange={(e) => updateItem(setItems, index, 'actionCode', e.target.value)}>{actionOptions.map((o) => <option key={o.code} value={o.code}>{o.name}</option>)}</select></td>
                  <td className="px-4 py-2"><select className="h-10 w-full min-w-[130px] rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary" value={item.damageLevelCode} onChange={(e) => updateItem(setItems, index, 'damageLevelCode', e.target.value)}>{damageOptions.map((o) => <option key={o.code} value={o.code}>{o.name}</option>)}</select></td>
                  <td className="px-4 py-2"><select className="h-10 w-full min-w-[110px] rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary" value={item.partDecisionCode} onChange={(e) => updateItem(setItems, index, 'partDecisionCode', e.target.value)}>{decisionOptions.map((o) => <option key={o.code} value={o.code}>{o.name}</option>)}</select></td>
                  <td className="px-4 py-2"><Input className="h-10 w-28 rounded-xl text-right text-sm" type="number" min="0" step="0.01" value={item.partValue} onChange={(e) => updateItem(setItems, index, 'partValue', e.target.value)} /></td>
                  <td className="px-2 py-2"><Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive" onClick={() => setItems((c) => c.filter((_, ci) => ci !== index))}><X className="h-3.5 w-3.5" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-border/40 px-4 py-3">
          <Button variant="ghost" size="sm" disabled={lastLineIncomplete} onClick={() => setItems((c) => [...c, createEmptyItem(c.length + 1, defaults)])}><Plus className="mr-1.5 h-4 w-4" />+ Agregar tarea</Button>
          {lastLineIncomplete ? <span className="ml-3 text-xs text-amber-600">Completá la línea actual antes de agregar otra.</span> : null}
        </div>
       </div>

      {showAccessoryBlock ? (
        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <h4 className="text-sm font-semibold">Trabajos extras</h4>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="grid flex-1 gap-3 md:grid-cols-3">
              <div className="space-y-1"><Label className="text-xs" htmlFor="accessory-work-enabled">Trabajos extras</Label><select id="accessory-work-enabled" className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm" value={accessoryUi?.enabled ?? 'NO'} onChange={(event) => updateAccessoryUi((current) => ({ ...current, enabled: event.target.value }))}><option value="NO">No</option><option value="SI">Sí</option></select></div>
              <div className="space-y-1"><Label className="text-xs" htmlFor="accessory-work-quoted">Cotizado</Label><Input id="accessory-work-quoted" value={fmt(accessoryTotals.quoted)} readOnly className="cursor-not-allowed bg-muted/60 font-semibold" /></div>
              <div className="space-y-1"><Label className="text-xs" htmlFor="accessory-work-vat">IVA</Label><select id="accessory-work-vat" className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm" value={accessoryUi?.vat ?? '21'} onChange={(event) => updateAccessoryUi((current) => ({ ...current, vat: event.target.value }))}><option value="0">0%</option><option value="10.5">10,5%</option><option value="21">21%</option></select></div>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={onAddAccessoryWork}><Plus className="mr-1.5 h-4 w-4" />Agregar trabajo extra</Button>
          </div>
          {/* Grilla local: estos extras no forman parte de las líneas ni del payload/PDF del presupuesto. */}
          {accessoryUi?.enabled === 'SI' ? (
            <div className="mt-4 space-y-3">
              {accessoryWorks.map((work) => (
                <div key={work.id} className="rounded-2xl border border-border/50 bg-background/50 p-4">
                  {/* Grilla de cada extra: mantiene sus importes aislados del presupuesto principal. */}
                    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_180px_auto]">
                     <div className="space-y-1"><Label className="text-xs" htmlFor={`accessory-piece-${work.id}`}>Pieza afectada</Label><Input id={`accessory-piece-${work.id}`} value={work.affectedPiece ?? ''} onChange={(event) => updateAccessoryUi((current) => ({ ...current, works: current.works.map((entry) => entry.id === work.id ? { ...entry, affectedPiece: event.target.value } : entry) }))} /></div>
                     <div className="space-y-1"><Label className="text-xs" htmlFor={`accessory-task-${work.id}`}>Tarea a ejecutar</Label><Input id={`accessory-task-${work.id}`} value={work.task ?? ''} onChange={(event) => updateAccessoryUi((current) => ({ ...current, works: current.works.map((entry) => entry.id === work.id ? { ...entry, task: event.target.value } : entry) }))} /></div>
                      <div className="space-y-1"><Label className="text-xs" htmlFor={`accessory-labor-${work.id}`}>Total MO</Label><Input id={`accessory-labor-${work.id}`} type="number" min="0" step="0.01" value={work.amount} onChange={(event) => updateAccessoryUi((current) => ({ ...current, works: current.works.map((entry) => entry.id === work.id ? { ...entry, amount: event.target.value } : entry) }))} /></div>
                    <div className="flex items-end"><Button type="button" variant="ghost" size="sm" onClick={() => updateAccessoryUi((current) => ({ ...current, works: current.works.filter((entry) => entry.id !== work.id), enabled: current.works.length === 1 ? 'NO' : current.enabled }))}>Quitar</Button></div>
                   </div>
                    <div className="mt-3 grid gap-3 md:grid-cols-[180px_minmax(0,1fr)_180px]">
                      <div className="space-y-1"><Label className="text-xs" htmlFor={`accessory-damage-${work.id}`}>Nivel de daño</Label><Input id={`accessory-damage-${work.id}`} value={work.damageLevel ?? ''} onChange={(event) => updateAccessoryUi((current) => ({ ...current, works: current.works.map((entry) => entry.id === work.id ? { ...entry, damageLevel: event.target.value } : entry) }))} /></div>
                     <div className="space-y-1"><Label className="text-xs">Incluye repuesto</Label><select className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm" value={work.includesReplacement} onChange={(event) => updateAccessoryUi((current) => ({ ...current, works: current.works.map((entry) => entry.id === work.id ? { ...entry, includesReplacement: event.target.value, replacementPiece: event.target.value === 'SI' ? entry.replacementPiece : '', replacementAmount: event.target.value === 'SI' ? entry.replacementAmount : '' } : entry) }))}><option value="NO">No</option><option value="SI">Sí</option></select></div>
                     {work.includesReplacement === 'SI' ? <><div className="space-y-1"><Label className="text-xs">Repuesto</Label><Input value={work.replacementPiece} onChange={(event) => updateAccessoryUi((current) => ({ ...current, works: current.works.map((entry) => entry.id === work.id ? { ...entry, replacementPiece: event.target.value } : entry) }))} /></div><div className="space-y-1"><Label className="text-xs">Monto repuesto</Label><Input type="number" min="0" step="0.01" value={work.replacementAmount} onChange={(event) => updateAccessoryUi((current) => ({ ...current, works: current.works.map((entry) => entry.id === work.id ? { ...entry, replacementAmount: event.target.value } : entry) }))} /></div></> : null}
                   </div>
                 </div>
              ))}
            </div>
          ) : <p className="mt-4 rounded-xl border border-border/50 bg-background/70 px-4 py-3 text-sm text-muted-foreground">No hay trabajos extras incluidos. Este bloque queda separado del presupuesto técnico y del reclamo a la compañía.</p>}
           <div className="mt-4 grid gap-3 md:grid-cols-2"><div className="space-y-1"><Label className="text-xs">Cliente confirma</Label><select className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm" value={accessoryUi?.customerConfirmed ?? 'NO'} onChange={(event) => updateAccessoryUi((current) => ({ ...current, customerConfirmed: event.target.value }))}><option value="NO">No</option><option value="SI">Sí</option></select></div><div className="space-y-1"><Label className="text-xs">Anotaciones</Label><Textarea rows={3} value={accessoryUi?.notes ?? ''} onChange={(event) => updateAccessoryUi((current) => ({ ...current, notes: event.target.value }))} /></div></div>
        </div>
      ) : null}

      {/* Trabajos adicionales */}
      <div className="rounded-2xl border border-border/60 bg-card p-5">
        <h4 className="mb-3 text-sm font-semibold">Trabajos adicionales</h4>
        <div className="flex flex-col gap-3">
          {[
            ['Estiraje en bancada', 'benchStraighteningApplies', 'benchStraighteningDetail'],
            ['Alineación', 'alignmentApplies', 'alignmentDetail'],
            ['Balanceo', 'balancingApplies', 'balancingDetail'],
            ['Recambio cristales', 'glassReplacementApplies', 'glassReplacementDetail'],
            ['Trabajos sist. eléctrico', 'electricalWorkApplies', 'electricalDetail'],
            ['Trabajos de mecánica', 'mechanicalWorkApplies', 'mechanicalWorkCode'],
          ].map(([label, appliesKey, detailKey]) => (
            <div key={label} className="flex flex-wrap items-center gap-2">
              <span className="min-w-[160px] text-xs font-medium text-muted-foreground">{label}</span>
              <select className="h-10 w-20 rounded-xl border border-input bg-background px-2 text-sm outline-none focus:border-primary" value={header[appliesKey] || 'NO'} onChange={(e) => setHeader((c) => ({ ...c, [appliesKey]: e.target.value }))}>
                {yesNoAV.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
              <Input className="h-10 flex-1 min-w-[200px] rounded-xl text-sm" value={header[detailKey] || ''} onChange={(e) => setHeader((c) => ({ ...c, [detailKey]: e.target.value }))} placeholder="Detalle" />
            </div>
          ))}
        </div>
      </div>

      {/* Repuestos cotizados + Observaciones */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <h4 className="mb-3 text-sm font-semibold">Repuestos cotizados</h4>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1"><Label className="text-xs">Fecha</Label><Input type="date" className="h-10 rounded-xl text-sm" value={header.quotedPartsDate} onChange={(e) => setHeader((c) => ({ ...c, quotedPartsDate: e.target.value }))} /></div>
            <div className="space-y-1"><Label className="text-xs">Proveedor</Label><ProviderSelector value={header.quotedPartsSupplier} providerId={header.providerId} onChange={({ providerId, snapshot }) => setHeader((current) => ({ ...current, providerId, quotedPartsSupplier: snapshot || '' }))} /></div>
          </div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <h4 className="mb-3 text-sm font-semibold">Observaciones</h4>
          <Textarea rows={3} value={header.observations} onChange={(e) => setHeader((c) => ({ ...c, observations: e.target.value }))} />
        </div>
      </div>

      {/* Totales */}
      <div className="rounded-2xl border border-border/60 bg-card p-5">
        <h4 className="mb-3 text-sm font-semibold">Totales y estimaciones</h4>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-1"><Label className="text-xs">Días estimados</Label><Input className="h-10 rounded-xl text-sm" type="number" min="0" value={header.estimatedDays} onChange={(e) => setHeader((c) => ({ ...c, estimatedDays: e.target.value }))} /></div>
          <div className="space-y-1"><Label className="text-xs">MO sin IVA</Label><Input className="h-10 rounded-xl text-sm" type="number" min="0" step="0.01" value={header.laborWithoutVat} onChange={(e) => setHeader((c) => ({ ...c, laborWithoutVat: e.target.value }))} /></div>
          <div className="space-y-1"><Label className="text-xs">Mínimo cierre MO</Label><Input className="h-10 rounded-xl text-sm" type="number" min="0" step="0.01" value={header.minimumCloseAmount} onChange={(e) => setHeader((c) => ({ ...c, minimumCloseAmount: e.target.value }))} /></div>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 rounded-xl border border-border/50 bg-background/70 px-4 py-3 text-sm">
          <span><span className="text-muted-foreground">Total repuestos: </span><span className="font-semibold">{fmt(partsSum)}</span></span>
          <span><span className="text-muted-foreground">MO s/IVA: </span><span className="font-semibold">{fmt(laborWithoutVat)}</span></span>
          <span><span className="text-muted-foreground">MO IVA incl.: </span><span className="font-semibold">{fmt(laborWithVat)}</span></span>
          <span><span className="text-muted-foreground">Total MO + Repuestos: </span><span className="font-bold text-primary">{fmt(laborWithVat + partsSum)}</span></span>
        </div>
      </div>

      {/* Fotos */}
      <div className="rounded-2xl border border-border/60 bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold">Fotos y videos del vehículo</p>
          <Button variant="outline" size="sm" onClick={() => photoInputRef.current?.click()}><ImagePlus className="mr-1.5 h-4 w-4" />Agregar</Button>
        </div>
        <input ref={photoInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadMutation.mutate(f); }} />
        {(docsQuery.data ?? []).length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border/70 py-6 text-center text-sm text-muted-foreground">Todavía no hay archivos.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {(docsQuery.data ?? []).map((doc) => (
              <button key={doc.id} type="button" className="group relative block h-32 w-32 overflow-hidden rounded-2xl border border-border/60 bg-muted" onClick={() => setPreviewDoc(doc)}>
                {doc.mimeType?.startsWith('image/') ? (<><img src={doc.blobUrl || ''} alt={doc.fileName} className="h-full w-full object-cover" /><div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100"><Eye className="h-6 w-6 text-white drop-shadow" /></div></>) : doc.mimeType?.startsWith('video/') ? (<div className="flex h-full w-full items-center justify-center bg-black/20"><Eye className="h-6 w-6 text-white drop-shadow" /><span className="absolute bottom-1 right-1 rounded bg-black/60 px-1 text-[9px] text-white">VIDEO</span></div>) : (<div className="flex h-full w-full flex-col items-center justify-center gap-1 text-xs text-muted-foreground"><Eye className="h-4 w-4" />{doc.extension?.toUpperCase()}</div>)}
                <button type="button" className="absolute right-1 top-1 rounded-lg bg-black/50 p-1 text-white opacity-0 transition hover:bg-red-600 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); setDeleteConfirm(doc); }}><Trash2 className="h-3 w-3" /></button>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Preview modal */}
      {previewDoc ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85" onClick={() => setPreviewDoc(null)}>
          <button type="button" className="absolute right-6 top-6 rounded-2xl bg-white/10 p-3 text-white transition hover:bg-white/20" onClick={() => setPreviewDoc(null)}><X className="h-6 w-6" /></button>
          <div className="flex h-full w-full items-center justify-center p-8" onClick={(e) => e.stopPropagation()}>
            {previewDoc.mimeType?.startsWith('image/') && previewDoc.blobUrl ? (<img src={previewDoc.blobUrl} alt={previewDoc.fileName} className="max-h-full max-w-full rounded-3xl object-contain shadow-haze" />) : previewDoc.mimeType?.startsWith('video/') ? (<video controls autoPlay className="max-h-full max-w-full rounded-3xl shadow-haze"><source src={previewDoc.blobUrl || ''} type={previewDoc.mimeType} /></video>) : (<div className="flex flex-col items-center gap-3 rounded-3xl bg-card p-10 text-muted-foreground"><Eye className="h-10 w-10" /><p className="text-sm">{previewDoc.fileName}</p></div>)}
          </div>
        </div>
      ) : null}

      {/* Delete confirm */}
      {deleteConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}>
          <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-haze" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">¿Eliminar documento?</h3><p className="mt-2 text-sm text-muted-foreground">Se va a borrar <strong>{deleteConfirm.fileName}</strong>.</p>
            <div className="mt-5 flex gap-3"><Button variant="outline" className="flex-1" onClick={() => setDeleteConfirm(null)}>Cancelar</Button><Button variant="destructive" className="flex-1" onClick={() => { deleteDocMutation.mutate(deleteConfirm.id); setDeleteConfirm(null); }}><Trash2 className="mr-1.5 h-4 w-4" />Eliminar</Button></div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

const updateItem = (setItems, index, key, value) => { setItems((c) => c.map((item, ci) => ci === index ? { ...item, [key]: value } : item)); };
