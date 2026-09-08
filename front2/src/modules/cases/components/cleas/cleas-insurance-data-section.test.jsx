import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CleasInsuranceDataSection } from './cleas-insurance-data-section';

const { getCleasInsurance, requestJson, saveCleasInsurance } = vi.hoisted(() => ({
  getCleasInsurance: vi.fn(),
  requestJson: vi.fn(),
  saveCleasInsurance: vi.fn(),
}));

vi.mock('@/modules/cases/api/cleas-api', () => ({ getCleasInsurance, saveCleasInsurance }));
vi.mock('@/shared/api/http-client', () => ({ requestJson }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const renderSection = () => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <CleasInsuranceDataSection caseId={42} />
  </QueryClientProvider>,
);

describe('CleasInsuranceDataSection', () => {
  // Los mocks son module-level: sin este reset, las aserciones leen llamadas del test anterior.
  beforeEach(() => { vi.clearAllMocks(); });

  it('does not render or submit policy and certificate fields', async () => {
    getCleasInsurance.mockResolvedValue({ insuranceCompanyId: 7, policyNumber: 'P-10', certificateNumber: 'C-20' });
    requestJson.mockImplementation((path) => {
      if (path === '/insurance/companies') return Promise.resolve([{ id: 7, name: 'Aseguradora' }]);
      if (path === '/insurance/companies/7/contacts') return Promise.resolve([]);
      return Promise.resolve({});
    });
    saveCleasInsurance.mockResolvedValue({ insuranceCompanyId: 7 });

    const user = userEvent.setup();
    renderSection();

    await screen.findByRole('button', { name: /guardar/i });
    expect(screen.queryByLabelText(/póliza/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/certificado/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /guardar/i }));
    await waitFor(() => expect(saveCleasInsurance).toHaveBeenCalled());
    expect(saveCleasInsurance.mock.calls[0][1]).not.toHaveProperty('policyNumber');
    expect(saveCleasInsurance.mock.calls[0][1]).not.toHaveProperty('certificateNumber');
  });

  it('hides the Todo Riesgo coverage detail and preserves any stored value on save', async () => {
    getCleasInsurance.mockResolvedValue({ insuranceCompanyId: 7, coverageDetail: 'Todo riesgo c/ franquicia 1.000.000' });
    requestJson.mockImplementation((path) => {
      if (path === '/insurance/companies') return Promise.resolve([{ id: 7, name: 'Aseguradora' }]);
      if (path === '/insurance/companies/7/contacts') return Promise.resolve([]);
      return Promise.resolve({});
    });
    saveCleasInsurance.mockResolvedValue({ insuranceCompanyId: 7 });

    const user = userEvent.setup();
    renderSection();

    // Esperar la hidratacion del draft antes de guardar.
    const companySelect = await screen.findByLabelText(/aseguradora del cliente/i);
    await waitFor(() => expect(companySelect).toHaveValue('7'));
    // Regla CLEAS: el detalle de cobertura pertenece a Todo Riesgo, no se edita aca.
    expect(screen.queryByLabelText(/detalle de cobertura/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /guardar/i }));
    await waitFor(() => expect(saveCleasInsurance).toHaveBeenCalled());
    // El valor almacenado se preserva: la seccion no borra datos existentes.
    expect(saveCleasInsurance.mock.calls[0][1].coverageDetail).toBe('Todo riesgo c/ franquicia 1.000.000');
  });
});
