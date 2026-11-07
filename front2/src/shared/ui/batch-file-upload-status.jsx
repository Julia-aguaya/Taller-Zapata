import { LoaderCircle } from 'lucide-react';
import { Button } from '@/shared/ui/button';

export const BatchFileUploadStatus = ({ upload, noun = 'fotos' }) => {
  if (!upload.isUploading && upload.failed.length === 0) return null;

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-sm" role="status" aria-live="polite">
      {upload.isUploading ? <div className="flex items-center gap-2 text-primary"><LoaderCircle className="h-4 w-4 animate-spin" /><span>Subiendo {noun}… ({upload.completed} de {upload.total})</span></div> : null}
      {!upload.isUploading && upload.failed.length > 0 ? <div className="space-y-2"><p className="font-medium text-destructive">No se pudieron subir: {upload.failed.map(({ file }) => file.name).join(', ')}.</p><Button type="button" size="sm" variant="outline" onClick={upload.retryFailed}>Reintentar archivos fallidos</Button></div> : null}
    </div>
  );
};
