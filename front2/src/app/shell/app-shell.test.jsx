import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '@/app/theme/theme-provider';

vi.mock('@/modules/auth/providers/session-provider', () => ({
  useSession: () => ({
    session: {
      unreadNotifications: 0,
      user: { displayName: 'Admin Taller', role: 'ADMIN' },
      navigation: {
        items: [
          { code: 'PANEL', label: 'Panel general', path: '/panel', enabled: true },
          { code: 'CASES', label: 'Carpetas', path: '/cases', enabled: true },
          { code: 'NEW_CASE', label: 'Nuevo caso', path: '/cases/new', enabled: true },
          { code: 'AGENDA', label: 'Agenda', path: '/agenda', enabled: true },
          { code: 'MANAGEMENT', label: 'Gestión', path: '/management', enabled: true },
        ],
      },
    },
    logout: vi.fn(),
  }),
}));

const { AppShell, resolveActiveNavigation } = await import('@/app/shell/app-shell');

function renderShell(initialEntries = ['/panel']) {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/" element={<AppShell />}>
          <Route path="panel" element={<div>Contenido Panel</div>} />
           <Route path="cases" element={<div>Contenido Carpetas</div>} />
            <Route path="cases/new/*" element={<div>Contenido Nuevo caso</div>} />
           <Route path="cases/:caseId" element={<div>Contenido Detalle carpeta</div>} />
           <Route path="agenda" element={<div>Contenido Agenda</div>} />
           <Route path="agenda/:taskId" element={<div>Contenido Detalle agenda</div>} />
            <Route path="management/clients" element={<div>Contenido Clientes</div>} />
            <Route path="management/vehicles" element={<div>Contenido Vehículos</div>} />
            <Route path="management/referrers" element={<div>Contenido Referenciadores</div>} />
            <Route path="management/insurance" element={<div>Contenido Compañías</div>} />
            <Route path="management/organization" element={<div>Contenido Taller y sucursales</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

describe('AppShell theme', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.className = '';
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.style.colorScheme = '';
  });

  it('inicia con el tema persistido', () => {
    window.localStorage.setItem('front2.theme', 'dark');

    renderShell();

    expect(document.documentElement).toHaveClass('dark');
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(screen.getByRole('button', { name: 'Activar tema claro' })).toBeInTheDocument();
  });

  it('toggle oscuro a claro, toggle claro a oscuro y persiste tras remount', async () => {
    window.localStorage.setItem('front2.theme', 'dark');
    const user = userEvent.setup();

    const firstRender = renderShell();

    await user.click(screen.getByRole('button', { name: 'Activar tema claro' }));

    expect(document.documentElement).not.toHaveClass('dark');
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    expect(window.localStorage.getItem('front2.theme')).toBe('light');
    expect(screen.getByRole('button', { name: 'Activar tema oscuro' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Activar tema oscuro' }));

    expect(document.documentElement).toHaveClass('dark');
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(window.localStorage.getItem('front2.theme')).toBe('dark');

    firstRender.unmount();
    renderShell();

    expect(document.documentElement).toHaveClass('dark');
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  });

  it('shell usa tokens semanticos en vez de clases oscuras hardcodeadas', () => {
    renderShell();

    const shellHeading = screen.getByText('Taller Zapata');
    const shellContainer = shellHeading.parentElement?.parentElement;

    expect(shellContainer).toBeInTheDocument();
    expect(shellContainer?.className).toContain('bg-[hsl(var(--shell-sidebar-bg)/0.92)]');
    expect(shellContainer?.className).not.toContain('dark:');
  });

  it('Gestión es un toggle y el submenú no duplica rutas operativas', async () => {
    const user = userEvent.setup();

    renderShell(['/panel']);

    await user.click(screen.getByRole('button', { name: 'Gestión' }));

    expect(screen.getByLabelText('Subsecciones de gestión')).toBeInTheDocument();
    const submenu = screen.getByLabelText('Subsecciones de gestión');
    expect(within(submenu).getByRole('button', { name: 'Proveedores' })).toBeDisabled();
    expect(within(submenu).queryByRole('button', { name: 'Carpetas' })).not.toBeInTheDocument();
    expect(within(submenu).queryByRole('button', { name: 'Agenda' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Gestión' }));
    expect(screen.queryByLabelText('Subsecciones de gestión')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Gestión' }));

    await user.click(screen.getByRole('button', { name: 'Taller y sucursales' }));
    expect(screen.getByText('Contenido Taller y sucursales')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clientes' }));
    expect(screen.getByText('Contenido Clientes')).toBeInTheDocument();
  });

  it('mantiene Gestión abierta y sólo su subsección actual al estar en una ruta secundaria', () => {
    renderShell(['/management/clients']);

    const management = screen.getByRole('button', { name: 'Gestión' });
    expect(management).not.toHaveAttribute('aria-current');
    expect(screen.getByLabelText('Subsecciones de gestión')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clientes' })).toHaveAttribute('aria-current', 'page');

    expect(screen.getByLabelText('Subsecciones de gestión')).toBeInTheDocument();
    expect(document.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
  });

  it.each([
    ['/panel', 'Panel general'],
    ['/cases', 'Carpetas'],
    ['/cases/15', 'Carpetas'],
    ['/cases/new', 'Nuevo caso'],
    ['/cases/new/cliente', 'Nuevo caso'],
    ['/agenda/tarea-8', 'Agenda'],
    ['/management/vehicles', 'Vehículos'],
  ])('resuelve una sola página activa al navegar directamente a %s', (pathname, label) => {
    renderShell([pathname]);

    expect(screen.getByRole('button', { name: label })).toHaveAttribute('aria-current', 'page');
    expect(document.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
  });

  it('no considera rutas internas del panel como la página del panel', () => {
    expect(resolveActiveNavigation('/panel/metricas')).toMatchObject({ primaryCode: null });
  });
});
