import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Eye, FileSearch, Plus, Trash2 } from 'lucide-react';
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

export const DocumentsSection = ({ caseId, cleasOrderPicker = false, moduleCode = null, includeHistorical = false, showCompleteAction = true, title = 'Documentación' }) => {
  const queryClient = useQueryClient();
  const { session } = useSession();
  const canUploadDocuments = session?.authorities?.includes('documento.subir') ?? false;
  const hasDeletePermission = session?.authorities?.includes('documento.eliminar') ?? false;
  const canDeleteDocuments = hasDeletePermission && hasGlobalAdminScope(session);
  const lacksGlobalDeleteScope = hasDeletePermission && !hasGlobalAdminScope(session);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploadCategory, setUploadCategory] = useState('');
  const [uploadDate, setUploadDate] = useState('');
  const [uploadObservations, setUploadObservations] = useState('');
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [showCompleteDocumentation, setShowCompleteDocumentation] = useState(false);
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

  const documents = (docsQuery.data ?? []).filter((document) => {
    if (!moduleCode) return true;
    return document.moduleCode === moduleCode || (includeHistorical && document.moduleCode === 'OPERACION');
  });
  const categories = categoriesQuery.data?.categories ?? [];
  const visibleCategories = categories.filter((category) => VISIBLE_DOCUMENT_CATEGORY_CODES.has(category.code));
  const selectedCategory = categories.find((category) => String(category.id) === uploadCategory);
  const requiresDate = Boolean(selectedCategory?.requiresDate);

  const deleteMutation = useMutation({
    mutationFn: (docId) => requestJson(`/documents/${docId}`, { method: 'DELETE' }),
    onSuccess: async () => { await invalidateCaseViews(); setDocumentToDelete(null); toast.success('Documento eliminado.'); },
    onError: (e) => toast.error(e.message),
  });

  const completeDocumentationMutation = useMutation({
    mutationFn: () => requestJson(`/cases/${caseId}/workflow/transitions`, { method: 'POST', body: JSON.stringify({ domain: 'documentacion', actionCode: 'documentacion.completar', reason: 'Documentación revisada y completa', automatic: false }) }),
    onSuccess: async () => { await invalidateCaseViews(); setShowCompleteDocumentation(false); toast.success('Documentación marcada como completa.'); },
    onError: (error) => toast.error(error.message || 'No se pudo actualizar la documentación.'),
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

  const allComplete = documents.length > 0 && documents.every(d => d.active !== false);
  const canUpload = Boolean(uploadFiles.length > 0 && uploadCategory && (!requiresDate || uploadDate));

  return (
    <div className="rounded-3xl border border-border/70 bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <FileSearch className="h-5 w-5" />
          </div>
          <h4 className="text-sm font-semibold">{title}</h4>
        </div>
        <div className="flex gap-2">
          {canUploadDocuments ? <Button size="sm" variant="outline" onClick={() => setShowUpload(true)}><Plus className="mr-1.5 h-3.5 w-3.5" />Agregar items</Button> : null}
          {showCompleteAction ? <Button size="sm" variant="outline" onClick={() => setShowCompleteDocumentation(true)}>Marcar completa</Button> : null}
          {documents.length > 0 ? <Button size="sm" variant="outline" onClick={downloadAll}><Download className="mr-1.5 h-3.5 w-3.5" />Descargar todo</Button> : null}
        </div>
      </div>

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
      {showCompleteAction ? <Dialog open={showCompleteDocumentation} onClose={() => setShowCompleteDocumentation(false)} title="¿Documentación completa?" description="Confirmá que la carpeta cuenta con toda la documentación necesaria. Esta acción actualiza el estado de la carpeta.">
        <div className="flex gap-3"><Button variant="outline" className="flex-1" onClick={() => setShowCompleteDocumentation(false)} disabled={completeDocumentationMutation.isPending}>Cancelar</Button><Button className="flex-1" onClick={() => completeDocumentationMutation.mutate()} disabled={completeDocumentationMutation.isPending}>Confirmar</Button></div>
      </Dialog> : null}

      {/* Status */}
      <div className="mt-4 flex items-center gap-3">
        <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${allComplete ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400' : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400'}`}>
          {allComplete ? 'Completa' : 'Incompleta'}
        </span>
      </div>
    </div>
  );
};
