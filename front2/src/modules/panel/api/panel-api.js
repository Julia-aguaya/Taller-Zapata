import { requestJson } from '@/shared/api/http-client';

export const getPanelGeneral = () => requestJson('/panel/general');
