import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, afterEach } from 'vitest';

const navigateMock = vi.fn();
const useQueryMock = vi.fn();
const contentSpy = vi.fn(() => <div data-testid="cases-page-content" />);

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args) => useQueryMock(...args),
}));

vi.mock('@/modules/cases/api/cases-api', () => ({
  listCases: vi.fn(),
}));

vi.mock('@/modules/cases/api/new-case-api', () => ({
  getCaseCatalogs: vi.fn(),
  getInsuranceCatalogs: vi.fn(),
}));

vi.mock('@/modules/agenda/api/agenda-api', () => ({
  listOperationalTasks: vi.fn(),
}));

vi.mock('@/modules/cases/components/cases-page-content', () => ({
  CasesPageContent: (props) => contentSpy(props),
}));

import { CasesPage } from '@/modules/cases/pages/cases-page';

const baseItems = [
  { id: 1, folderCode: 'CAR-001', branchId: 1, branchCode: 'Z' },
  { id: 2, folderCode: 'CAR-002', branchId: 2, branchCode: 'C' },
];

function mockQuerySequence(sequence) {
  useQueryMock.mockReset();
  sequence.forEach((result) => useQueryMock.mockReturnValueOnce(result));
}

afterEach(() => {
  contentSpy.mockClear();
  navigateMock.mockReset();
});

describe('CasesPage', () => {
  it('no usa los resultados filtrados como fuente de opciones mientras la query de catalogo sigue pendiente', () => {
    mockQuerySequence([
      { isLoading: false, isError: false, data: { caseTypes: [] } },
      { isSuccess: false, isError: false, data: null },
      { isError: false, data: { items: [] } },
      { isLoading: false, isError: false, isFetching: false, data: { items: [baseItems[0]] } },
      { isLoading: false, isError: false, data: undefined },
    ]);

    render(<CasesPage />);

    expect(screen.getByTestId('cases-page-content')).toBeInTheDocument();
    expect(contentSpy).toHaveBeenCalledTimes(1);
    expect(contentSpy.mock.calls[0][0].items).toEqual([baseItems[0]]);
    expect(contentSpy.mock.calls[0][0].filterSourceItems).toEqual([]);
  });

  it('usa la fuente dedicada de opciones cuando ya esta disponible', () => {
    mockQuerySequence([
      { isLoading: false, isError: false, data: { caseTypes: [] } },
      { isSuccess: false, isError: false, data: null },
      { isError: false, data: { items: [] } },
      { isLoading: false, isError: false, isFetching: false, data: { items: [baseItems[0]] } },
      { isLoading: false, isError: false, data: { items: baseItems, totalElements: 2 } },
    ]);

    render(<CasesPage />);

    expect(contentSpy).toHaveBeenCalledTimes(1);
    expect(contentSpy.mock.calls[0][0].filterSourceItems).toEqual(baseItems);
    expect(contentSpy.mock.calls[0][0].totalCount).toBe(2);
  });
});
