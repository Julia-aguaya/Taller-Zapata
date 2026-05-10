import { render as rtlRender, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from './themeProvider.jsx';

/**
 * Renderiza un componente con todos los providers necesarios para testing.
 *
 * @param {React.ReactElement} ui - Componente a renderizar
 * @param {object} options - Opciones de renderizado
 * @param {object} [options.route] - Ruta inicial para MemoryRouter
 * @param {object} [options.initialState] - Estado inicial si hay reducer/context
 * @param {boolean} [options.withRouter] - Si-wrapear con MemoryRouter (default: true)
 * @returns {object} - { rerender, unmount, result }
 */
export function render(ui, options = {}) {
  const {
    route = '/',
    initialState = {},
    withRouter = true,
    ...restOptions
  } = options;

  const Wrapper = ({ children }) => {
    let content = children;

    if (withRouter) {
      content = (
        <MemoryRouter initialEntries={[route]}>
          {content}
        </MemoryRouter>
      );
    }

    // Agregar más providers aquí según necesidad
    // Por ejemplo: AuthProvider, ThemeProvider, etc.

    return content;
  };

  const result = rtlRender(ui, { wrapper: Wrapper, ...restOptions });

  return {
    ...result,
    // Helper para buscar elementos con queries comunes
    screen,
    // Helper para simulated user events
    user: userEvent.setup(),
  };
}

/**
 * Renderiza solo el componente sin providers de router.
 * Útil para tests de componentes puros.
 */
export function renderPure(ui, options = {}) {
  return rtlRender(ui, options);
}

/**
 * Renderiza con router pero sin estado inicial.
 * Útil para tests de integración de navegación.
 */
export function renderWithRouter(ui, route = '/') {
  return render(ui, { route, withRouter: true });
}

// Re-exportar todo de @testing-library/react para acceso directo
export * from '@testing-library/react';
export { screen, userEvent };