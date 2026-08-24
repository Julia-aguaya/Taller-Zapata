import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { InsuranceDataSection } from './insurance-data-section';

const { requestJson } = vi.hoisted(() => ({ requestJson: vi.fn() }));

vi.mock('@/shared/api/http-client', () => ({ requestJson }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const renderSection = () => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <InsuranceDataSection caseId={42} />
  </QueryClientProvider>,
);

describe('InsuranceDataSection', () => {
  it('creates and selects a processor without submitting insurance data into the route', async () => {
    window.history.replaceState({}, '', '/cases/42');
    requestJson.mockImplementation((path, options) => {
      if (path === '/cases/42/insurance') return Promise.resolve({ insuranceCompanyId: 7 });
      if (path === '/insurance/companies') return Promise.resolve([{ id: 7, name: 'Aseguradora' }]);
      if (path === '/insurance/companies/7/contacts') return Promise.resolve([]);
      if (path === '/persons' && options?.method === 'POST') return Promise.resolve({ id: 31, nombre: 'Ana', apellido: 'Gestora' });
      if (path === '/persons/31') return Promise.resolve({ id: 31, nombre: 'Ana', apellido: 'Gestora', nombreMostrar: 'Ana Gestora' });
      return Promise.resolve({});
    });
    const user = userEvent.setup();

    renderSection();
    await screen.findAllByText('Sin contactos.');
    await user.type(screen.getByPlaceholderText('Ej: 4-2541587'), 'S-123');
    await user.type(screen.getByPlaceholderText('Ej: Cobertura para luneta y equipo de GNC'), 'Luneta');
    await user.click(screen.getAllByRole('button', { name: /crear/i })[0]);
    await user.type(screen.getByPlaceholderText('Nombre'), 'Ana');
    fireEvent.submit(screen.getByRole('dialog').querySelector('form'));

    await waitFor(() => expect(requestJson).toHaveBeenCalledWith('/insurance/companies/7/contacts', expect.objectContaining({ method: 'POST' })));
    await screen.findByText('Ana Gestora');
    expect(window.location.pathname).toBe('/cases/42');
    expect(window.location.search).toBe('');
    expect(screen.getByPlaceholderText('Ej: 4-2541587')).toHaveValue('S-123');
    expect(screen.getByPlaceholderText('Ej: Cobertura para luneta y equipo de GNC')).toHaveValue('Luneta');
  });
});
