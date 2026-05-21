import { afterEach, describe, expect, it, vi } from 'vitest';
import { readAuthenticatedCases } from '../../../lib/api/backend';

describe('readAuthenticatedCases', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('serializa todos los filtros avanzados soportados al backend', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ items: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    vi.stubGlobal('fetch', fetchMock);

    await readAuthenticatedCases('token-demo', {
      page: 0,
      size: 200,
      openedFrom: '2026-02-01',
      openedTo: '2026-02-28',
      paidFrom: '2026-03-01',
      paidTo: '2026-03-31',
      caseTypeCode: 'PARTICULAR',
      opinionCode: 'PROCEDE',
      managerCode: 'ABOGADO',
      visibleTramiteState: 'EN_TRAMITE',
      visibleRepairState: 'CON_TURNO',
      paymentStateCode: 'PAGADO',
      hasPendingTasks: true,
      pendingTaskAssignedUserId: 3,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [requestUrl, requestOptions] = fetchMock.mock.calls[0];
    const endpoint = new URL(String(requestUrl));

    expect(endpoint.pathname).toBe('/api/v1/cases');
    expect(endpoint.searchParams.get('page')).toBe('0');
    expect(endpoint.searchParams.get('size')).toBe('200');
    expect(endpoint.searchParams.get('openedFrom')).toBe('2026-02-01');
    expect(endpoint.searchParams.get('openedTo')).toBe('2026-02-28');
    expect(endpoint.searchParams.get('paidFrom')).toBe('2026-03-01');
    expect(endpoint.searchParams.get('paidTo')).toBe('2026-03-31');
    expect(endpoint.searchParams.get('caseTypeCode')).toBe('PARTICULAR');
    expect(endpoint.searchParams.get('opinionCode')).toBe('PROCEDE');
    expect(endpoint.searchParams.get('managerCode')).toBe('ABOGADO');
    expect(endpoint.searchParams.get('visibleTramiteState')).toBe('EN_TRAMITE');
    expect(endpoint.searchParams.get('visibleRepairState')).toBe('CON_TURNO');
    expect(endpoint.searchParams.get('paymentStateCode')).toBe('PAGADO');
    expect(endpoint.searchParams.get('hasPendingTasks')).toBe('true');
    expect(endpoint.searchParams.get('pendingTaskAssignedUserId')).toBe('3');
    expect(requestOptions.headers.Authorization).toBe('Bearer token-demo');
  });
});
