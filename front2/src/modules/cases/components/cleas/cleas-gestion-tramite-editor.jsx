import { CleasClaimDataSection } from './cleas-claim-data-section';
import { CleasDefinitionSection } from './cleas-definition-section';
import { CleasGeneralDataSection } from './cleas-general-data-section';
import { CleasInsuranceDataSection } from './cleas-insurance-data-section';
import { CleasProcedureSection } from './cleas-procedure-section';
import { DocumentsSection } from '@/modules/cases/components/documents-section';
import { TaskAgenda } from '@/modules/cases/components/task-agenda';
import { Button } from '@/shared/ui/button';

export const CleasGestionTramiteEditor = ({ caseId, caseDetail, nroCleas, setNroCleas, insurance, onInsuranceChange, cleasAgreedAmount, setCleasAgreedAmount, cleasFranchiseDistribution, onCleasFranchiseDistributionChange, cleasOver = 'damage', opinion = 'favorable', onCleasOverChange, onOpinionChange, cleasClosedAt, onRequestClosure }) => {
  const isAdverseTotal = cleasOver === 'damage' && opinion === 'unfavorable';
  return <div className="mt-5 space-y-5 pb-20" data-testid="cleas-gestion-tramite-editor">
    <CleasGeneralDataSection caseDetail={caseDetail} />
    <CleasDefinitionSection caseId={caseId} cleasOver={cleasOver} opinion={opinion} onCleasOverChange={onCleasOverChange} onOpinionChange={onOpinionChange} onHydrated={(definition) => { onCleasOverChange?.(definition.scopeCode === 'FRANQUICIA' ? 'franchise' : 'damage'); onOpinionChange?.({ PENDIENTE: 'pending', EN_CONTRA: 'unfavorable', CULPA_COMPARTIDA: 'shared', A_FAVOR: 'favorable' }[definition.opinionCode] ?? 'favorable'); }} readOnly={Boolean(cleasClosedAt)} />
    {isAdverseTotal && !cleasClosedAt ? <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/60 dark:text-red-300 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">Dictamen en contra</p><p className="mt-1">El trámite CLEAS no puede continuar. El caso debe cerrarse; el cliente deberá reparar el vehículo por su cuenta o iniciar acciones judiciales.</p></div><Button type="button" variant="destructive" onClick={onRequestClosure}>Cerrar caso</Button></div> : null}
    {cleasClosedAt ? <div role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">Cerrado por dictamen CLEAS en contra: {new Date(cleasClosedAt).toLocaleString('es-AR')}</div> : <><CleasInsuranceDataSection caseId={caseId} initialCleasNumber={nroCleas} onCleasNumberChange={setNroCleas} onClaimNumberChange={(claimNumber) => onInsuranceChange?.((current) => ({ ...current, claimNumber }))} onHydrated={(saved) => { setNroCleas?.(saved.cleasNumber ?? ''); onInsuranceChange?.({ clientCompany: '', claimNumber: saved.claimNumber ?? '' }); }} /><CleasClaimDataSection caseId={caseId} /><DocumentsSection caseId={caseId} cleasOrderPicker />{!isAdverseTotal ? <CleasProcedureSection caseId={caseId} cleasOver={cleasOver} opinion={opinion} cleasAgreedAmount={cleasAgreedAmount} setCleasAgreedAmount={setCleasAgreedAmount} cleasFranchiseDistribution={cleasFranchiseDistribution} onCleasFranchiseDistributionChange={onCleasFranchiseDistributionChange} /> : null}<TaskAgenda caseId={caseId} organizationId={caseDetail?.organizationId} branchId={caseDetail?.branchId} /></>}
  </div>;
};
