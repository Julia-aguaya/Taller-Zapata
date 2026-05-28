import { numberValue } from '../../gestion/lib/gestionUtils';
import { buildPartSignature } from '../../../lib/utils/exportHelpers';

export function buildBudgetPersistenceFields(selectedCase) {
  return {
    estimatedDays: Number.parseInt(selectedCase?.budget?.estimatedWorkDays || '0', 10) || null,
    observations: selectedCase?.budget?.observations || null,
  };
}

export function buildBudgetItemPersistenceFields(line) {
  return {
    partValue: numberValue(line?.partPrice),
    laborAmount: numberValue(line?.laborWithoutVat),
  };
}

export function buildPersistedPartsBySignature(parts = []) {
  return new Map(
    parts.map((entry) => [
      buildPartSignature({
        description: entry?.description,
        statusCode: entry?.statusCode,
        finalPrice: entry?.finalPrice,
      }),
      entry,
    ]),
  );
}

export function resolvePersistedPartId(localPart, persistedPartsBySignature) {
  if (localPart?.backendId) {
    return localPart.backendId;
  }

  return persistedPartsBySignature.get(buildPartSignature(localPart))?.id || null;
}
