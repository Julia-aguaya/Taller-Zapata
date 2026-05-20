import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import NuevoCaso from '../../../features/newCase/components/NuevoCaso';

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
  it('muestra el boton bloqueado con feedback visible durante la creacion', () => {
    render(<NuevoCaso {...buildProps({ isCreating: true })} />);

    expect(screen.getByRole('button', { name: /generando carpeta/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /generando carpeta/i })).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText(/bloqueamos el boton para evitar duplicados/i)).toBeInTheDocument();
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
});
