import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronRight, Download, Eye, FileSearch, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import { requestJson } from '@/shared/api/http-client';
import { uploadFileResumably } from '@/modules/cases/api/resumable-file-upload-api';
import { readStoredAuth } from '@/shared/auth/session-storage';
import { useSession } from '@/modules/auth/providers/session-provider';
import { hasGlobalAdminScope } from '@/modules/auth/lib/global-admin-scope';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Dialog } from '@/shared/ui/dialog';

const VISIBLE_DOCUMENT_CATEGORY_CODES = new Set(['PERSONAL', 'SEGURO', 'VEHICULO', 'OTRO']);
import { Textarea } from '@/shared/ui/textarea';
import { createCleasOrder } from '@/modules/cases/api/cleas-api';

const DATE_FMT = new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
const currentLocalDate = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
};

export const DocumentsSection = ({ caseId, cleasOrderPicker = false, moduleCode = null, includeHistorical = false, showCompleteAction = true, title = 'Documentación', categoryCodes = VISIBLE_DOCUMENT_CATEGORY_CODES, collapsible = false, showAllCategories = false, editableMetadata = false }) => {
  const queryClient = useQueryClient();
  const { session } = useSession();
  const canUploadDocuments = session?.authorities?.includes('documento.subir') ?? false;
  const hasDeletePermission = session?.authorities?.includes('documento.eliminar') ?? false;
  const canDeleteDocuments = hasDeletePermission && hasGlobalAdminScope(session);
  const lacksGlobalDeleteScope = hasDeletePermission && !hasGlobalAdminScope(session);
  const canEditDocumentMetadata = editableMetadata && (session?.authorities?.includes('documento.editar') ?? false);
  const canCompleteDocumentation = session?.authorities?.includes('workflow.documentacion.completar') ?? false;
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploadCategory, setUploadCategory] = useState('');
  const [uploadDate, setUploadDate] = useState('');
  const [uploadObservations, setUploadObservations] = useState('');
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [documentToEdit, setDocumentToEdit] = useState(null);
  const [editCategory, setEditCategory] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editObservations, setEditObservations] = useState('');
  const [documentationFeedback, setDocumentationFeedback] = useState('');
  const [expanded, setExpanded] = useState(!collapsible);
  const invalidateCaseViews = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ['cases'] }),
    queryClient.invalidateQueries({ queryKey: ['cases', String(caseId)] }),
    queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'workspace'] }),
    queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'documents'] }),
    queryClient.invalidateQueries({ queryKey: ['panel'] }),
  ]);

  const docsQuery = useQuery({
    queryKey: ['cases', String(caseId), 'documents', moduleCode, includeHistorical],
    queryFn: () => requestJson(`/cases/${caseId}/documents${moduleCode && !includeHistorical ? `?moduleCode=${encodeURIComponent(moduleCode)}` : ''}`),
  });

  const categoriesQuery = useQuery({
    queryKey: ['documents', 'catalogs'],
    queryFn: () => requestJson('/documents/catalogs'),
  });

  const caseQuery = useQuery({
    queryKey: ['cases', String(caseId)],
    queryFn: () => requestJson(`/cases/${caseId}`),
  });

  const documents = (docsQuery.data ?? []).filter((document) => {
    if (!moduleCode) return true;
    return document.moduleCode === moduleCode || (includeHistorical && document.moduleCode === 'OPERACION');
  });
  const categories = categoriesQuery.data?.categories ?? [];
  const visibleCategories = showAllCategories ? categories : categories.filter((category) => categoryCodes.has(category.code));
  const selectedCategory = categories.find((category) => String(category.id) === uploadCategory);
  const requiresDate = Boolean(selectedCategory?.requiresDate);
  const selectedEditCategory = categories.find((category) => String(category.id) === editCategory);
  const editRequiresDate = Boolean(selectedEditCategory?.requiresDate);

  const deleteMutation = useMutation({
    mutationFn: (docId) => requestJson(`/documents/${docId}`, { method: 'DELETE' }),
    onSuccess: async () => { await invalidateCaseViews(); setDocumentToDelete(null); toast.success('Documento eliminado.'); },
    onError: (e) => toast.error(e.message),
  });

  const updateDocumentMutation = useMutation({
    mutationFn: () => requestJson(`/documents/${documentToEdit.documentId}`, {
      method: 'PUT',
      body: JSON.stringify({
        categoryId: Number(editCategory),
        subcategoryCode: documentToEdit.subcategoryCode ?? null,
        documentDate: editDate || null,
        originCode: documentToEdit.originCode ?? null,
        observations: editObservations.trim() || null,
        active: documentToEdit.active ?? true,
      }),
    }),
    onSuccess: async () => { await invalidateCaseViews(); setDocumentToEdit(null); toast.success('Documento actualizado.'); },
    onError: (error) => toast.error(error.message),
  });

  const completeDocumentationMutation = useMutation({
    mutationFn: () => requestJson(`/cases/${caseId}/workflow/transitions`, { method: 'POST', body: JSON.stringify({ domain: 'documentacion', actionCode: 'documentacion.completar', reason: 'Documentación revisada y completa', automatic: false }) }),
    onSuccess: async () => { await invalidateCaseViews(); setDocumentationFeedback('Estado de documentación actualizado a Completa.'); },
    onError: (error) => setDocumentationFeedback(error.message || 'No se pudo actualizar la documentación.'),
  });

  const linkCleasOrderMutation = useMutation({
    mutationFn: (documentId) => createCleasOrder(caseId, { documentId, principal: false, visibleToCustomer: false, visualOrder: 0 }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'cleas', 'orders'] });
      toast.success('Orden CLEAS vinculada.');
    },
    onError: (error) => toast.error(error.message || 'No se pudo vincular la orden CLEAS.'),
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      const uploaded = [];
      for (const file of uploadFiles) {
        const document = await uploadFileResumably({
          file,
          metadata: { caseId, categoryId: uploadCategory, documentDate: requiresDate ? uploadDate : null, observations: uploadObservations.trim() || null, originCode: 'SEED_LOCAL' },
          relation: { caseId: Number(caseId), entityType: 'CASO', entityId: Number(caseId), moduleCode: moduleCode || 'OPERACION', principal: false, visibleToCustomer: false, visualOrder: 0 },
        });
        uploaded.push(document);
      }
      return uploaded;
    },
    onSuccess: async (uploaded) => { await invalidateCaseViews(); toast.success(`${uploaded.length} documento(s) subido(s).`); setShowUpload(false); setUploadFiles([]); setUploadDate(''); setUploadObservations(''); },
    onError: (e) => toast.error(e.message),
  });

  const fetchDocumentBlob = async (doc) => {
    const auth = readStoredAuth();
    const token = auth?.accessToken;
    if (!token) { toast.error('No hay sesión activa.'); return null; }
    const res = await fetch(`/api/v1/cases/${caseId}/documents/${doc.documentId}/download`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) { toast.error('No se pudo obtener el documento.'); return null; }
    return await res.blob();
  };

  const handleView = async (doc) => {
    const blob = await fetchDocumentBlob(doc);
    if (!blob) return;
    window.open(URL.createObjectURL(blob), '_blank');
  };

  const handleDownload = async (doc) => {
    const blob = await fetchDocumentBlob(doc);
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = doc.fileName || 'documento';
    a.click();
  };

  const downloadAll = async () => {
    const auth = readStoredAuth();
    const token = auth?.accessToken;
    if (!token) { toast.error('No hay sesión activa.'); return; }
    const params = new URLSearchParams();
    documents.forEach((document) => params.append('documentId', String(document.documentId)));
    const res = await fetch(`/api/v1/cases/${caseId}/documents/zip${params.size > 0 ? `?${params}` : ''}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) { toast.error('No se pudo descargar el comprimido.'); return; }
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `documentos-caso-${caseId}.zip`;
    a.click();
    toast.success('Descargando comprimido...');
  };

  const documentationComplete = caseQuery.data?.currentDocumentationStateCode === 'COMPLETA';
  const canUpload = Boolean(uploadFiles.length > 0 && uploadCategory && (!requiresDate || uploadDate));
  const documentationSelectDisabled = !canCompleteDocumentation || documentationComplete || caseQuery.isLoading || completeDocumentationMutation.isPending;

  const updateDocumentationStatus = (event) => {
    if (event.target.value !== 'COMPLETA' || documentationComplete) return;
    setDocumentationFeedback('Actualizando estado de documentación...');
    completeDocumentationMutation.mutate();
  };

  const openMetadataEditor = (doc) => {
    setDocumentToEdit(doc);
    setEditCategory(String(doc.categoryId));
    setEditDate(doc.documentDate?.slice(0, 10) ?? '');
    setEditObservations(doc.observations ?? '');
  };

  return (
    <div className="rounded-3xl border border-border/70 bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <FileSearch className="h-5 w-5" />
          </div>
          {collapsible ? <Button variant="ghost" size="sm" className="h-auto px-0 text-sm font-semibold" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}>{expanded ? <ChevronDown className="mr-1.5 h-4 w-4" /> : <ChevronRight className="mr-1.5 h-4 w-4" />}{title}</Button> : <h4 className="text-sm font-semibold">{title}</h4>}
        </div>
        {expanded ? <div className="flex gap-2">
          {canUploadDocuments ? <Button size="sm" variant="outline" onClick={() => setShowUpload(true)}><Plus className="mr-1.5 h-3.5 w-3.5" />Agregar items</Button> : null}
          {documents.length > 0 ? <Button size="sm" variant="outline" onClick={downloadAll}><Download className="mr-1.5 h-3.5 w-3.5" />Descargar todo</Button> : null}
        </div> : null}
      </div>

      {expanded ? <>

      {/* Upload dialog */}
      {showUpload ? (
        <Dialog open={showUpload} onClose={() => setShowUpload(false)} title="Subir documento">
            <div className="space-y-3">
              <div>
                <label htmlFor="document-category" className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Categoría</label>
                <select id="document-category" value={uploadCategory} onChange={(e) => { const category = categories.find((item) => String(item.id) === e.target.value); setUploadCategory(e.target.value); setUploadDate(category?.requiresDate ? currentLocalDate() : ''); }} className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20">
                  <option value="">Seleccionar...</option>
                   {visibleCategories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                </select>
              </div>
               <div>
                  <label htmlFor="document-file" className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Archivos</label>
                  <Input id="document-file" type="file" multiple onChange={(e) => setUploadFiles(Array.from(e.target.files ?? []))} />
                  {uploadFiles.length > 0 ? <p className="mt-1 text-xs text-muted-foreground">{uploadFiles.length} archivo(s) seleccionado(s).</p> : null}
               </div>
                {requiresDate ? (
                  <div>
                    <label htmlFor="document-date" className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Fecha del documento *</label>
                    <Input id="document-date" type="date" value={uploadDate} required onChange={(e) => setUploadDate(e.target.value)} />
                  </div>
                ) : null}
                <div>
                  <label htmlFor="document-observations" className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Observaciones</label>
                  <Textarea id="document-observations" value={uploadObservations} onChange={(e) => setUploadObservations(e.target.value)} className="min-h-[80px] resize-y" />
                </div>
               <div className="flex gap-2">
                <Button size="sm" onClick={() => uploadMutation.mutate()} disabled={!canUpload || uploadMutation.isPending}>Subir</Button>
                <Button size="sm" variant="ghost" onClick={() => setShowUpload(false)}>Cancelar</Button>
              </div>
            </div>
        </Dialog>
      ) : null}

      {/* Documents table */}
      {documents.length > 0 ? (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-border/50 text-muted-foreground">
                <th className="px-2 py-2 text-left font-semibold uppercase tracking-wider">Categoría</th>
                <th className="px-2 py-2 text-left font-semibold uppercase tracking-wider">Tipo archivo / nombre</th>
                <th className="px-2 py-2 text-left font-semibold uppercase tracking-wider">Fecha de carga</th>
                <th className="px-2 py-2 text-left font-semibold uppercase tracking-wider">Observaciones</th>
                <th className="px-2 py-2 text-left font-semibold uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.relationId ?? doc.documentId} className="border-b border-border/20 hover:bg-muted/30">
                  <td className="px-2 py-2.5">{categories.find(c => c.id === doc.categoryId)?.name ?? 'General'}</td>
                  <td className="px-2 py-2.5 font-medium">{doc.fileName ?? doc.storageKey ?? '—'}</td>
                  <td className="px-2 py-2.5 text-muted-foreground">{doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('es-AR') : '—'}</td>
                  <td className="px-2 py-2.5 text-muted-foreground max-w-[200px] truncate">{doc.observations ?? '—'}</td>
                   <td className="px-2 py-2.5">
                     <div className="flex gap-1">
                        {cleasOrderPicker && categories.find((category) => category.id === doc.categoryId)?.code === 'ORDEN_CLEAS' ? <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => linkCleasOrderMutation.mutate(doc.documentId)} disabled={linkCleasOrderMutation.isPending}><Plus className="mr-1.5 h-3.5 w-3.5" />Vincular orden</Button> : null}
                        {canEditDocumentMetadata ? <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => openMetadataEditor(doc)}><Pencil className="mr-1.5 h-3.5 w-3.5" />Editar</Button> : null}
                        <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => handleView(doc)}><Eye className="mr-1.5 h-3.5 w-3.5" />Visualizar</Button>
                      <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => handleDownload(doc)}><Download className="mr-1.5 h-3.5 w-3.5" />Descargar</Button>
                        {canDeleteDocuments ? <Button variant="ghost" size="sm" className="h-8 px-2 text-destructive" onClick={() => setDocumentToDelete(doc)} disabled={deleteMutation.isPending}><Trash2 className="mr-1.5 h-3.5 w-3.5" />Eliminar</Button> : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-4 text-xs text-muted-foreground">No hay documentos cargados.</p>
      )}
      {lacksGlobalDeleteScope ? <p role="alert" className="mt-3 text-sm text-destructive">No tenés alcance administrativo global para eliminar documentos.</p> : null}

      <Dialog
        open={Boolean(documentToDelete)}
        onClose={() => { if (!deleteMutation.isPending) setDocumentToDelete(null); }}
        title="¿Eliminar documento?"
        description={`El documento ${documentToDelete?.fileName ?? 'seleccionado'} se eliminará de forma permanente.`}
      >
        <div className="flex gap-3">
          <Button type="button" variant="outline" className="flex-1" data-dialog-initial-focus onClick={() => setDocumentToDelete(null)} disabled={deleteMutation.isPending}>Cancelar</Button>
          <Button type="button" variant="destructive" className="flex-1" onClick={() => documentToDelete && deleteMutation.mutate(documentToDelete.documentId)} disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </div>
      </Dialog>
      <Dialog open={Boolean(documentToEdit)} onClose={() => { if (!updateDocumentMutation.isPending) setDocumentToEdit(null); }} title="Editar documento">
        <div className="space-y-3">
          <div>
            <label htmlFor="edit-document-category" className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Categoría del documento</label>
            <select id="edit-document-category" value={editCategory} onChange={(event) => setEditCategory(event.target.value)} className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20">
              {visibleCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </div>
          {editRequiresDate ? <div>
            <label htmlFor="edit-document-date" className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Fecha del documento *</label>
            <Input id="edit-document-date" type="date" value={editDate} required onChange={(event) => setEditDate(event.target.value)} />
          </div> : null}
          <div>
            <label htmlFor="edit-document-observations" className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Observaciones del documento</label>
            <Textarea id="edit-document-observations" value={editObservations} onChange={(event) => setEditObservations(event.target.value)} className="min-h-[80px] resize-y" />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => updateDocumentMutation.mutate()} disabled={!editCategory || (editRequiresDate && !editDate) || updateDocumentMutation.isPending}>Guardar</Button>
            <Button size="sm" variant="ghost" onClick={() => setDocumentToEdit(null)} disabled={updateDocumentMutation.isPending}>Cancelar</Button>
          </div>
        </div>
      </Dialog>
      {showCompleteAction ? <div className="mt-4 max-w-sm">
        <label htmlFor={`documentation-status-${caseId}`} className="mb-1 block text-sm font-medium">Estado de documentación</label>
        <select
          id={`documentation-status-${caseId}`}
          value={documentationComplete ? 'COMPLETA' : 'PENDIENTE'}
          onChange={updateDocumentationStatus}
          disabled={documentationSelectDisabled}
          aria-describedby={`documentation-status-help-${caseId} documentation-status-feedback-${caseId}`}
          className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="PENDIENTE">Pendiente</option>
          <option value="COMPLETA">Completa</option>
        </select>
        <p id={`documentation-status-help-${caseId}`} className="mt-1 text-xs text-muted-foreground">
          {documentationComplete ? 'La documentación ya fue marcada como completa.' : canCompleteDocumentation ? 'Al seleccionar Completa se registra la revisión manual de la carpeta.' : 'No tenés permiso para actualizar este estado.'}
        </p>
        <p id={`documentation-status-feedback-${caseId}`} className="mt-1 text-xs text-muted-foreground" aria-live="polite">
          {documentationFeedback}
        </p>
      </div> : null}
      </> : null}
    </div>
  );
};
