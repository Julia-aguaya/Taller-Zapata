import { requestJson } from '@/shared/api/http-client';

export const getBudgetCatalogs = () => requestJson('/budget/catalogs');
