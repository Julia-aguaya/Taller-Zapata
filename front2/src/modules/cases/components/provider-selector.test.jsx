import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockSearchProviders = vi.fn();

vi.mock('@/modules/cases/api/providers-api', () => ({
  searchProviders: (...args) => mockSearchProviders(...args),
}));

const { ProviderSelector, providerPayload } = await import('./provider-selector');

const renderSelector = (props = {}) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ProviderSelector value="" providerId={null} onChange={vi.fn()} {...props} />
    </QueryClientProvider>,
  );
};

describe('providerPayload', () => {
  beforeEach(() => {
    mockSearchProviders.mockReset();
  });

  it('uses the canonical provider id and its name as the immutable transaction snapshot', () => {
    expect(providerPayload({ id: 18, name: 'Repuestos Norte' }, 'Texto anterior')).toEqual({
      providerId: 18,
      snapshot: 'Repuestos Norte',
    });
  });

  it('keeps free text and clears the provider id when no master is selected', () => {
    expect(providerPayload(null, '  Casa de repuestos local  ')).toEqual({
      providerId: null,
      snapshot: 'Casa de repuestos local',
    });
  });

  it('searches providers by q and renders the name-only provider model', async () => {
    const user = userEvent.setup();
    mockSearchProviders.mockResolvedValue([{ id: 18, name: 'Repuestos Norte', phone: '3415550000' }]);

    renderSelector();
    await user.type(screen.getByPlaceholderText('Buscar proveedor...'), 'Nor');

    expect(await screen.findByRole('button', { name: /Repuestos Norte/i })).toBeInTheDocument();
    await waitFor(() => expect(mockSearchProviders).toHaveBeenCalledWith('Nor'));
    expect(screen.queryByText(/displayName|razonSocial/i)).not.toBeInTheDocument();
  });

  it('makes the catalog-versus-free-text persistence semantics explicit', () => {
    renderSelector();

    expect(screen.getByText(/Seleccionar vincula un proveedor existente/i)).toBeInTheDocument();
    expect(screen.getByText(/no crea un proveedor/i)).toBeInTheDocument();
  });
});
