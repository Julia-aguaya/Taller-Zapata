import { FRANCHISE_RECOVERY_TRAMITE } from '../../newCase/constants/formOptions';

export function isTodoRiesgoCase(item) {
  return (item.tramiteType ?? 'Particular') === 'Todo Riesgo';
}

export function isCleasCase(item) {
  return (item.tramiteType ?? 'Particular') === 'CLEAS / Terceros / Franquicia';
}

export function isThirdPartyWorkshopCase(item) {
  return (item.tramiteType ?? 'Particular') === 'Reclamo de Tercero - Taller';
}

export function isThirdPartyLawyerCase(item) {
  return (item.tramiteType ?? 'Particular') === 'Reclamo de Tercero - Abogado';
}

export function isFranchiseRecoveryCase(item) {
  return (item.tramiteType ?? 'Particular') === FRANCHISE_RECOVERY_TRAMITE;
}

export function isThirdPartyClaimCase(item) {
  return isThirdPartyWorkshopCase(item) || isThirdPartyLawyerCase(item);
}

export function isInsuranceWorkflowCase(item) {
  return isTodoRiesgoCase(item) || isCleasCase(item) || isThirdPartyClaimCase(item);
}

export function getPrimaryFolderPerson(item) {
  if (isThirdPartyClaimCase(item) && item.thirdParty?.clientRegistry?.isOwner === 'NO') {
    return item.thirdParty.clientRegistry.owners?.find((owner) => owner.firstName || owner.lastName) || item.customer;
  }

  return item.customer;
}

export function getFolderDisplayName(item) {
  const person = getPrimaryFolderPerson(item);
  return `${person.lastName || ''}, ${person.firstName || ''}`.replace(/^,\s*/, '').trim() || 'Sin titular';
}

export function hasRegistryOwnerIdentity(owner) {
  return Boolean(owner?.firstName || owner?.lastName || owner?.document);
}

export function isThirdPartyDocumentationIncomplete(item) {
  return isThirdPartyClaimCase(item) && item.thirdParty?.claim?.documentationStatus === 'Incompleta';
}

export function isJudicialInstance(instance) {
  return instance === 'Judicial';
}
