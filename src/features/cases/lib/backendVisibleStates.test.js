import { describe, expect, it } from 'vitest';
import { applyBackendVisibleStatesToCase, PARTICULAR_VISIBLE_STATE_OPTIONS } from './backendVisibleStates';

describe('PARTICULAR visible states', () => {
  it('uses the backend projection instead of retaining a locally derived state', () => {
    const result = applyBackendVisibleStatesToCase({
      computed: { tramiteStatus: 'Pagado local', repairStatus: 'Reparado local' },
      backendVisibleStates: {
        tramite: { label: 'Ingresado' },
        reparacion: { label: 'En trámite' },
      },
    });

    expect(result.computed).toMatchObject({ tramiteStatus: 'Ingresado', repairStatus: 'En trámite' });
  });

  it('uses TODO_RIESGO effective states instead of a local repair or no-repair derivation', () => {
    const result = applyBackendVisibleStatesToCase({
      tramiteType: 'Todo Riesgo',
      computed: { tramiteStatus: 'Pagado local', repairStatus: 'No debe repararse local' },
      backendVisibleStates: {
        tramite: { code: 'EN_TRAMITE', label: 'En trámite' },
        reparacion: { code: 'DAR_TURNO', label: 'Dar turno' },
      },
    });

    expect(result.computed).toMatchObject({ tramiteStatus: 'En trámite', repairStatus: 'Dar turno' });
  });

  it('only exposes the approved PARTICULAR override codes', () => {
    expect(PARTICULAR_VISIBLE_STATE_OPTIONS.tramite.map(({ code }) => code)).toEqual(['', 'INGRESADO', 'PASADO_A_PAGOS', 'PAGADO', 'RECHAZADO', 'DESISTIDO']);
    expect(PARTICULAR_VISIBLE_STATE_OPTIONS.reparacion.map(({ code }) => code)).toEqual(['', 'EN_TRAMITE', 'DAR_TURNO', 'FALTAN_REPUESTOS', 'CON_TURNO', 'DEBE_REINGRESAR', 'REPARADO', 'RECHAZADO', 'DESISTIDO']);
  });
});
