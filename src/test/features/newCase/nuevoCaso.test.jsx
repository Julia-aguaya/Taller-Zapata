import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import NuevoCaso from '../../../features/newCase/components/NuevoCaso';
import { server } from '../../setupTests';

function buildProps(overrides = {}) {
  return {
    autofilledFields: [],
    customerLookupState: { status: 'idle', message: '', detail: '' },
    form: {
      type: 'Particular',
      branch: 'Casa Central',
      claimNumber: '',
      document: '30111888',
      firstName: 'Juan',
      lastName: 'Perez',
      phone: '1122334455',
      plate: 'AA123BB',
      brand: 'Toyota',
      model: 'Corolla',
      vehicleType: '',
      vehicleUse: '',
      paint: '',
      referenced: 'NO',
      referenciadorId: '',
      referencedName: '',
    },
    isCreating: false,
    missing: [],
    nextCode: 'PAR-000123',
    onChange: vi.fn(),
    onCreate: vi.fn(),
    onSearchDocument: vi.fn(),
    onSearchPlate: vi.fn(),
    showValidation: false,
    vehicleLookupState: { status: 'idle', message: '', detail: '' },
    ...overrides,
  };
}

describe('NuevoCaso', () => {
  it('muestra el botón bloqueado con feedback visible durante la creación', () => {
    render(<NuevoCaso {...buildProps({ isCreating: true })} />);

    expect(screen.getByRole('button', { name: /generando carpeta/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /generando carpeta/i })).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText(/bloqueamos el botón para evitar duplicados/i)).toBeInTheDocument();
  });

  it('evita el doble click cuando el flujo padre pasa a estado de carga', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();

    function ControlledNuevoCaso() {
      const [isCreating, setIsCreating] = useState(false);

      const handleCreate = () => {
        if (isCreating) {
          return;
        }

        setIsCreating(true);
        onCreate();
      };

      return <NuevoCaso {...buildProps({ isCreating, onCreate: handleCreate })} />;
    }

    render(<ControlledNuevoCaso />);

    await user.dblClick(screen.getByRole('button', { name: /generar carpeta particular/i }));

    expect(onCreate).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: /generando carpeta/i })).toBeDisabled();
  });

  it('muestra feedback especifico mientras busca cliente o vehiculo', () => {
    render(
      <NuevoCaso
        {...buildProps({
          customerLookupState: {
            status: 'loading',
            message: 'Buscando cliente',
            detail: 'Estamos buscando el cliente con DNI 30111888.',
          },
          vehicleLookupState: {
            status: 'loading',
            message: 'Buscando vehículo',
            detail: 'Estamos buscando el vehículo con patente AA123BB.',
          },
        })}
      />,
    );

    expect(screen.getByRole('button', { name: /buscando cliente por dni/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /buscando vehículo por patente/i })).toBeDisabled();
    expect(screen.getByText(/estamos buscando el cliente con dni 30111888/i)).toBeInTheDocument();
    expect(screen.getByText(/estamos buscando el vehículo con patente aa123bb/i)).toBeInTheDocument();
  });

  it('consulta y selecciona el referenciador canónico por id', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    server.use(http.get('*/api/v1/referenciadores', () => HttpResponse.json([
      { id: 12, nombre: 'Ana', apellido: 'Ruiz', displayName: 'Ana Ruiz', activo: true },
    ])));

    render(<NuevoCaso {...buildProps({ accessToken: 'token', form: { ...buildProps().form, referenced: 'SI' }, onChange })} />);

    const referrerField = await screen.findByText('Referenciador');
    await user.selectOptions(referrerField.parentElement.querySelector('select'), '12');

    expect(onChange).toHaveBeenNthCalledWith(1, 'referenciadorId', '12');
    expect(onChange).toHaveBeenNthCalledWith(2, 'referencedName', 'Ana Ruiz');
    expect(screen.queryByLabelText('Nombre del referenciado')).not.toBeInTheDocument();
  });
});
