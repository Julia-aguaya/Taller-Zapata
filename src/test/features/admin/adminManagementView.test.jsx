import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminManagementView from '../../../features/admin/components/AdminManagementView';
import { WORKSHOP_STORAGE_KEY } from '../../../features/gestion/lib/workshopCatalog';

describe('AdminManagementView', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('permite editar desde Gestion los datos de talleres usados en presupuesto', async () => {
    const user = userEvent.setup();

    render(
      <AdminManagementView
        backendSession={{
          user: { role: 'admin' },
          accessToken: '',
        }}
      />,
    );

    expect(screen.getByText('Cabecera de presupuesto')).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: 'Editar' })[0]);

    const legalNameInput = screen.getByLabelText('Razón social');
    await user.clear(legalNameInput);
    await user.type(legalNameInput, 'Taller Zapata Actualizado SRL');
    await user.click(screen.getByRole('button', { name: 'Guardar taller' }));

    const storedCatalog = JSON.parse(window.localStorage.getItem(WORKSHOP_STORAGE_KEY) || '[]');
    expect(storedCatalog[0].legalName).toBe('Taller Zapata Actualizado SRL');
    expect(screen.getByText('Datos del taller guardados para la plantilla de presupuesto.')).toBeInTheDocument();
  });
});
