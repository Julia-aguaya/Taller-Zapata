import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Eye, FileSearch, ImagePlus, Paperclip, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { requestJson } from '@/shared/api/http-client';
import { Button } from '@/shared/ui/button';
import { Label } from '@/shared/ui/label';

const API = '/api/v1';
const fetchJson = (url) => requestJson(url);

export const DocumentacionEditor = ({ caseId, docStatus, onDocStatusChange, onSaved }) => {
  const queryClient = useQueryClient();
  const fileRef = useRef(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);

  const catalogsQuery = useQuery({ queryKey: ['documents', 'catalogs'], queryFn: () => fetchJson('/documents/catalogs') });
  const docsQuery = useQuery({ queryKey: ['cases', String(caseId), 'documents'], queryFn: () => fetchJson(`/cases/${caseId}/documents`) });

  const categories = catalogsQuery.data?.categories ?? [];
  const docs = docsQuery.data ?? [];

  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('categoryId', selectedCategory || '');
      if (caseId) formData.append('caseId', String(caseId));
      const res = await fetch(`${API}/documents`, { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }, body: formData });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.message || 'Error al subir'); }
      return res.json();
    },
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'documents'] }); await onSaved?.(); toast.success('Documento subido.'); if (fileRef.current) fileRef.current.value = ''; },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (docId) => fetchJson(`/documents/${docId}`, { method: 'DELETE' }),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'documents'] }); await onSaved?.(); toast.success('Documento eliminado.'); },
    onError: (e) => toast.error(e.message),
  });

  const getCatName = (catId) => categories.find((c) => c.id === catId)?.name || 'Sin categoría';

  return (
    <div className="rounded-3xl border border-border/70 bg-card p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><FileSearch className="h-5 w-5" /></div>
          <h4 className="text-lg font-semibold">Documentación</h4>
          <p className="mt-1 text-sm text-muted-foreground">Documentación del siniestro y del vehículo.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}><ImagePlus className="mr-1.5 h-4 w-4" />Subir archivo</Button>
        </div>
      </div>

      {/* Estado de documentación */}
      <div className="mb-4 flex items-center gap-4 rounded-2xl border border-border/60 bg-background/70 p-4">
        <span className="text-sm font-medium">Estado:</span>
        <button type="button" onClick={() => onDocStatusChange?.('COMPLETA')}
          className={`rounded-2xl border px-4 py-2 text-sm font-medium transition ${docStatus === 'COMPLETA' ? 'border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400' : 'border-border/60 hover:border-emerald-300'}`}>
          Completa
        </button>
        <button type="button" onClick={() => onDocStatusChange?.('INCOMPLETA')}
          className={`rounded-2xl border px-4 py-2 text-sm font-medium transition ${docStatus === 'INCOMPLETA' ? 'border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400' : 'border-border/60 hover:border-amber-300'}`}>
          Incompleta
        </button>
      </div>

      {/* Warning si incompleta */}
      {docStatus === 'INCOMPLETA' ? (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400">
          ⚠️ <strong>Carpeta con documentación pendiente.</strong> Completala para poder avanzar con la tramitación.
        </div>
      ) : null}

      {/* Upload */}
      <div className="mb-4 flex items-end gap-3">
        <div className="flex-1 space-y-1.5">
          <Label className="text-xs">Categoría</Label>
          <select className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
            <option value="">Seleccionar categoría...</option>
            {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
          </select>
        </div>
        <input ref={fileRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadMutation.mutate(f); }} />
        <Button size="sm" onClick={() => { if (!selectedCategory) { toast.error('Seleccioná una categoría.'); return; } fileRef.current?.click(); }} disabled={uploadMutation.isPending}>{uploadMutation.isPending ? 'Subiendo...' : 'Seleccionar archivo'}</Button>
      </div>

      {/* Lista */}
      {docs.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border/70 py-8 text-center text-sm text-muted-foreground">Sin documentos cargados. Usá el botón "Subir archivo" para agregar.</p>
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{docs.length} archivo(s)</span>
            <Button variant="outline" size="sm" onClick={() => docs.forEach((d) => window.open(`${API}/cases/${caseId}/documents/${d.id}/download`, '_blank'))}>
              <Download className="mr-1.5 h-4 w-4" />Descargar todo
            </Button>
          </div>
          <div className="grid gap-2">
            {docs.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{doc.originalFilename || doc.publicId}</p>
                    <p className="text-xs text-muted-foreground">{getCatName(doc.categoryId)}</p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button type="button" className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-primary/10 hover:text-primary" onClick={() => setPreviewUrl(`${API}/cases/${caseId}/documents/${doc.id}/download`)} title="Previsualizar"><Eye className="h-4 w-4" /></button>
                  <button type="button" className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950" onClick={() => deleteMutation.mutate(doc.id)} title="Eliminar"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Preview modal */}
      {previewUrl ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setPreviewUrl(null)}>
          <button type="button" className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20" onClick={() => setPreviewUrl(null)}><X className="h-5 w-5" /></button>
          <iframe src={previewUrl} className="h-[85vh] w-[85vw] rounded-3xl border border-border bg-white" title="Preview" onClick={(e) => e.stopPropagation()} />
        </div>
      ) : null}
    </div>
  );
};
