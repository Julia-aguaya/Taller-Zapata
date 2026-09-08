import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
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
});
