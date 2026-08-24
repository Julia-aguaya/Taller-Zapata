import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchProviders } from '@/modules/cases/api/providers-api';
import { Input } from '@/shared/ui/input';

const useDebouncedValue = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedValue(value.trim()), delay);
    return () => window.clearTimeout(timer);
  }, [delay, value]);

  return debouncedValue;
};

export const providerPayload = (provider, snapshot) => ({
  providerId: provider?.id ?? null,
  snapshot: provider ? provider.name : snapshot?.trim() || null,
});

export const ProviderSelector = ({ value, providerId, onChange, placeholder = 'Buscar proveedor...', disabled = false, ariaLabel = 'Buscar proveedor', canSearch = true, allowManual = true }) => {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const debouncedSearch = useDebouncedValue(search);
  const providersQuery = useQuery({
    queryKey: ['providers', 'search', debouncedSearch],
    queryFn: () => searchProviders(debouncedSearch),
    enabled: canSearch && debouncedSearch.length >= 2 && !selected && !providerId,
  });

  const selectProvider = (provider) => {
    setSelected(provider);
    setSearch('');
    onChange(providerPayload(provider, value));
  };

  const clearProvider = () => {
    setSelected(null);
    onChange(providerPayload(null, value));
  };

  const selectedLabel = selected?.name || (providerId ? value : null);

  return (
    <div className="space-y-2">
      {selectedLabel ? (
        <div className="flex min-h-10 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-sm dark:border-emerald-800 dark:bg-emerald-950">
          <span className="font-medium text-emerald-800 dark:text-emerald-200">{selectedLabel}</span>
            <button type="button" className="ml-auto text-xs text-muted-foreground hover:text-destructive" onClick={clearProvider} disabled={disabled}>Cambiar</button>
        </div>
      ) : (
        <>
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={placeholder} aria-label={ariaLabel} data-dialog-initial-focus disabled={disabled || !canSearch} />
          {(providersQuery.data ?? []).length > 0 ? (
            <div className="rounded-xl border border-border bg-card p-1 shadow-haze">
              {providersQuery.data.map((provider) => (
                <button key={provider.id} type="button" className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-accent" onClick={() => selectProvider(provider)} disabled={disabled}>
                  <span className="font-medium">{provider.name}</span>
                  {provider.phone ? <span className="ml-2 text-xs text-muted-foreground">{provider.phone}</span> : null}
                </button>
              ))}
            </div>
          ) : canSearch && debouncedSearch.length >= 2 && !providersQuery.isFetching ? (
            <p className="text-xs text-muted-foreground">No encontramos proveedores. Podés cargar el nombre manualmente abajo.</p>
          ) : null}
        </>
      )}
      {allowManual ? <><Input value={value || ''} onChange={(event) => { setSelected(null); onChange(providerPayload(null, event.target.value)); }} placeholder="O ingresá el proveedor manualmente" disabled={disabled} />
      <p className="text-xs text-muted-foreground">Seleccionar vincula un proveedor existente. El texto manual queda sólo en esta tramitación y no crea un proveedor.</p></> : null}
    </div>
  );
};
