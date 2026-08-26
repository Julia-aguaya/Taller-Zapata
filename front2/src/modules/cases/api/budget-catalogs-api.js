import { requestJson } from '@/shared/api/http-client';

const entries = (value) => Array.isArray(value) ? value.filter((entry) => entry && typeof entry === 'object') : [];

export const getBudgetCatalogs = async () => {
  const catalogs = await requestJson('/budget/catalogs');
  return {
    ...(catalogs && typeof catalogs === 'object' && !Array.isArray(catalogs) ? catalogs : {}),
    taskCodes: entries(catalogs?.taskCodes),
    actionCodes: entries(catalogs?.actionCodes),
    damageLevelCodes: entries(catalogs?.damageLevelCodes),
    partDecisionCodes: entries(catalogs?.partDecisionCodes),
  };
};
