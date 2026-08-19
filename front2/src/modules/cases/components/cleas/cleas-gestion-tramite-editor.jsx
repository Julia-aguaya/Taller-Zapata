import { useState } from 'react';
import { Badge } from '@/shared/ui/badge';
import { DocumentsSection } from '@/modules/cases/components/documents-section';
import { TaskAgenda } from '@/modules/cases/components/task-agenda';
import { CleasClaimDataSection } from './cleas-claim-data-section';
import { CleasDefinitionSection } from './cleas-definition-section';
import { CleasGeneralDataSection } from './cleas-general-data-section';
import { CleasInsuranceDataSection } from './cleas-insurance-data-section';
import { CleasProcedureSection } from './cleas-procedure-section';

const initialInsurance = { clientCompany: '', claimNumber: '', thirdPartyCompany: '', cleasNumber: '', processor: '', inspector: '' };
const initialClaim = { location: '', time: '', thirdPartyPlate: '', dynamics: '', observations: '' };
const initialProcedure = {
  presentedAt: '', inspectionForwardedAt: '', modality: '', minimumCloseAmount: '', includesParts: '', quotation: '', quotationDate: '',
  agreedAmount: '', franchiseAmount: '', companyRequiredAmount: '', partsProvider: '', partsAuthorization: '',
};

const changeValue = (setValues) => (name) => (event) => setValues((values) => ({ ...values, [name]: event.target.value }));

export const CleasGestionTramiteEditor = ({ caseId, caseDetail, previewMode = false }) => {
  const [cleasOver, setCleasOver] = useState('damage');
  const [opinion, setOpinion] = useState('pending');
  const [insurance, setInsurance] = useState(initialInsurance);
  const [claim, setClaim] = useState(initialClaim);
  const [procedure, setProcedure] = useState(initialProcedure);

  return (
    <div className="mt-5 space-y-5 pb-20" data-testid="cleas-gestion-tramite-editor">
      {previewMode ? <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary"><Badge>Vista previa</Badge>Los campos CLEAS de esta vista son locales y no se guardan.</div> : null}

      {/* Orden visual CLEAS: mové estas secciones sin afectar TODO_RIESGO, GRANIZO ni PARTICULAR. */}
      <CleasGeneralDataSection caseDetail={caseDetail} />
      <CleasDefinitionSection cleasOver={cleasOver} opinion={opinion} onCleasOverChange={setCleasOver} onOpinionChange={setOpinion} />
      <CleasInsuranceDataSection values={insurance} onChange={changeValue(setInsurance)} />
      <CleasClaimDataSection values={claim} onChange={changeValue(setClaim)} />
      <DocumentsSection caseId={caseId} />
      <CleasProcedureSection cleasOver={cleasOver} opinion={opinion} values={procedure} onChange={changeValue(setProcedure)} />
      <TaskAgenda caseId={caseId} organizationId={caseDetail?.organizationId} branchId={caseDetail?.branchId} />
    </div>
  );
};
