import { useState } from 'react';
import { CleasClaimDataSection } from './cleas-claim-data-section';
import { CleasDefinitionSection } from './cleas-definition-section';
import { CleasGeneralDataSection } from './cleas-general-data-section';
import { CleasInsuranceDataSection } from './cleas-insurance-data-section';
import { CleasProcedureSection } from './cleas-procedure-section';

const initialInsurance = { clientCompany: '', claimNumber: '', thirdPartyCompany: '', processor: '', inspector: '' };
const initialClaim = { location: '', time: '', thirdPartyPlate: '', dynamics: '', observations: '' };
const initialProcedure = {
  presentedAt: '', inspectionForwardedAt: '', modality: '', minimumCloseAmount: '', includesParts: '', quotation: '', quotationDate: '',
  agreedAmount: '', partsProvider: '', partsAuthorization: '',
};

const changeValue = (setValues) => (name) => (event) => setValues((values) => ({ ...values, [name]: event.target.value }));

export const CleasGestionTramiteEditor = ({ caseId, caseDetail, nroCleas, setNroCleas, cleasAgreedAmount, setCleasAgreedAmount, cleasFranchiseDistribution, onCleasFranchiseDistributionChange, cleasOver = 'damage', opinion = 'favorable', onCleasOverChange, onOpinionChange, cleasClosedAt, onRequestClosure }) => {
  const [insurance, setInsurance] = useState(initialInsurance);
  const [claim, setClaim] = useState(initialClaim);
  const [procedure, setProcedure] = useState(initialProcedure);

  return (
    <div className="mt-5 space-y-5 pb-20" data-testid="cleas-gestion-tramite-editor">
      {/* Orden visual CLEAS: mové estas secciones sin afectar TODO_RIESGO, GRANIZO ni PARTICULAR. */}
      <CleasGeneralDataSection caseDetail={caseDetail} />
      <CleasDefinitionSection cleasOver={cleasOver} opinion={opinion} onCleasOverChange={onCleasOverChange} onOpinionChange={onOpinionChange} readOnly={Boolean(cleasClosedAt)} />
      {cleasClosedAt ? (
        <div role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Cerrado por dictamen CLEAS en contra: {new Date(cleasClosedAt).toLocaleString('es-AR')}
        </div>
      ) : (
        <>
          <CleasInsuranceDataSection values={insurance} onChange={changeValue(setInsurance)} nroCleas={nroCleas} setNroCleas={setNroCleas} />
          <CleasClaimDataSection values={claim} onChange={changeValue(setClaim)} />
          <CleasProcedureSection caseDetail={caseDetail} cleasOver={cleasOver} opinion={opinion} values={procedure} onChange={changeValue(setProcedure)} cleasAgreedAmount={cleasAgreedAmount} setCleasAgreedAmount={setCleasAgreedAmount} cleasFranchiseDistribution={cleasFranchiseDistribution} onCleasFranchiseDistributionChange={onCleasFranchiseDistributionChange} onRequestClosure={onRequestClosure} />
        </>
      )}
    </div>
  );
};
