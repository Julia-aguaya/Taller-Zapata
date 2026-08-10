import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import userEvent from '@testing-library/user-event';
import AdminManagementView from '../../../features/admin/components/AdminManagementView';
import { WORKSHOP_STORAGE_KEY } from '../../../features/gestion/lib/workshopCatalog';
import { server } from '../../setupTests';

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

  it('guarda el catálogo de talleres en backend cuando hay sesión autenticada', async () => {
    const user = userEvent.setup();
    let savedPayload = null;

    server.use(
      http.get('*/api/v1/organizations', () => HttpResponse.json([])),
      http.get('*/api/v1/branches', () => HttpResponse.json([])),
      http.get('*/api/v1/roles', () => HttpResponse.json([])),
      http.get('*/api/v1/users', () => HttpResponse.json([])),
      http.get('*/api/v1/referral-contacts', () => HttpResponse.json([])),
      http.get('*/api/v1/system/parameters/WORKSHOP_CATALOG', () => HttpResponse.json({
        code: 'WORKSHOP_CATALOG',
        value: JSON.stringify([
          {
            id: 'zapata',
            label: 'Taller Zapata',
            legalName: 'Catálogo Global Backend SRL',
            taxId: '30-99999999-9',
            taxCondition: 'Responsable Inscripto',
            address: 'Backend 456',
            phone: '3419999999',
            email: 'backend@test.com',
            logo: '',
          },
        ]),
        dataTypeCode: 'JSON',
        description: 'Catalogo compartido de talleres para presupuesto',
        editable: true,
        visible: false,
        moduleCode: 'GESTION',
      })),
      http.put('*/api/v1/system/parameters/WORKSHOP_CATALOG', async ({ request }) => {
        savedPayload = await request.json();
        return HttpResponse.json({
          code: 'WORKSHOP_CATALOG',
          value: savedPayload.value,
          dataTypeCode: 'JSON',
          description: savedPayload.description,
          editable: true,
          visible: false,
          moduleCode: 'GESTION',
        });
      }),
    );

    render(
      <AdminManagementView
        backendSession={{
          user: { role: 'admin' },
          accessToken: 'mock-access-token-12345',
        }}
      />,
    );

    expect(await screen.findByText('Cabecera de presupuesto')).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: 'Editar' })[0]);

    const legalNameInput = screen.getByLabelText('Razón social');
    await user.clear(legalNameInput);
    await user.type(legalNameInput, 'Taller Zapata Backend SRL');
    await user.click(screen.getByRole('button', { name: 'Guardar taller' }));

    const storedCatalog = JSON.parse(window.localStorage.getItem(WORKSHOP_STORAGE_KEY) || '[]');
    expect(storedCatalog[0].legalName).toBe('Taller Zapata Backend SRL');
    expect(savedPayload.code).toBe('WORKSHOP_CATALOG');
    expect(JSON.parse(savedPayload.value)[0].legalName).toBe('Taller Zapata Backend SRL');
    expect(savedPayload.dataTypeCode).toBe('JSON');
    expect(screen.getByText('Datos del taller guardados para la plantilla de presupuesto.')).toBeInTheDocument();
  });

  it('no expone ni consulta el catálogo legado de referenciados', async () => {
    let legacyRequests = 0;
    server.use(
      http.get('*/api/v1/organizations', () => HttpResponse.json([])),
      http.get('*/api/v1/branches', () => HttpResponse.json([])),
      http.get('*/api/v1/roles', () => HttpResponse.json([])),
      http.get('*/api/v1/users', () => HttpResponse.json([])),
      http.get('*/api/v1/system/parameters/WORKSHOP_CATALOG', () => HttpResponse.json({ value: '[]' })),
      http.all('*/api/v1/referral-contacts', () => {
        legacyRequests += 1;
        return HttpResponse.json([]);
      }),
    );

    render(<AdminManagementView backendSession={{ user: { role: 'admin' }, accessToken: 'mock-access-token-12345' }} />);

    await waitFor(() => expect(screen.getByText('Administración de usuarios y talleres')).toBeInTheDocument());
    expect(screen.queryByText('Catálogo general')).not.toBeInTheDocument();
    expect(legacyRequests).toBe(0);
  });
});
