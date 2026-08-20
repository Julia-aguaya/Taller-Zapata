import { FileText } from 'lucide-react';
import { toast } from 'sonner';
import { TramiteSummarySection } from '@/modules/cases/components/tramite-summary-section';
import { InsuranceDataSection } from '@/modules/cases/components/insurance-data-section';
import { ClaimDataSection } from '@/modules/cases/components/claim-data-section';
import { DeductibleSection } from '@/modules/cases/components/deductible-section';
import { DocumentsSection } from '@/modules/cases/components/documents-section';
import { ProcedureSection } from '@/modules/cases/components/procedure-section';
import { TaskAgenda } from '@/modules/cases/components/task-agenda';
import { CleasGestionTramiteEditor } from '@/modules/cases/components/cleas/cleas-gestion-tramite-editor';
import { readStoredAuth } from '@/shared/auth/session-storage';

export const GestionTramiteEditor = ({ caseId, caseDetail, budget, nroCleas, setNroCleas, cleasAgreedAmount, setCleasAgreedAmount, onSaved }) => {
  const caseTypeCode = caseDetail?.caseTypeCode;
  const showFranchise = caseTypeCode !== 'GRANIZO';

  if (caseTypeCode === 'CLEAS') {
    return <CleasGestionTramiteEditor caseId={caseId} caseDetail={caseDetail} nroCleas={nroCleas} setNroCleas={setNroCleas} cleasAgreedAmount={cleasAgreedAmount} setCleasAgreedAmount={setCleasAgreedAmount} />;
  }

  const generatePdf = async () => {
    try {
      const auth = readStoredAuth();
      const resp = await fetch(`/api/v1/cases/${caseId}/tramite/pdf`, {
        headers: { 'X-User-Id': auth?.userId ?? '1' },
      });
      if (!resp.ok) throw new Error('Error al generar PDF');
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tramite-${caseId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF generado.');
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div className="mt-5 space-y-5 pb-20">
      {/* 1. Datos generales del trámite */}
      <TramiteSummarySection caseId={caseId} />

      {/* 2. Datos del seguro */}
      <InsuranceDataSection caseId={caseId} caseDetail={caseDetail} />

      {/* 3. Datos del siniestro */}
      <ClaimDataSection caseId={caseId} />

      {/* 4. Franquicia (no aplica para GRANIZO) */}
      {showFranchise ? (
        <DeductibleSection caseId={caseId} caseDetail={caseDetail} />
      ) : null}

      {/* 5. Documentación */}
      <DocumentsSection caseId={caseId} />

      {/* 6. Tramitación */}
      <ProcedureSection caseId={caseId} budget={budget} />

      {/* 7. Agenda de tareas */}
      <TaskAgenda caseId={caseId} organizationId={caseDetail?.organizationId} branchId={caseDetail?.branchId} />

      {/* Floating PDF button */}
      <button onClick={generatePdf}
        className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition hover:bg-primary/90 active:scale-95">
        <FileText className="h-4 w-4" />
        Generar PDF
      </button>
    </div>
  );
};
