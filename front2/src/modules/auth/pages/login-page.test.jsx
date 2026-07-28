import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const loginMock = vi.fn();
const useLocationMock = vi.fn();

let sessionState;

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');

  return {
    ...actual,
    Navigate: ({ to, replace }) => <div data-replace={String(replace)} data-testid="navigate" data-to={to} />,
    useLocation: () => useLocationMock(),
  };
});

vi.mock('@/modules/auth/providers/session-provider', () => ({
  useSession: () => sessionState,
}));

import { LoginPage } from '@/modules/auth/pages/login-page';

const createDeferred = () => {
  let resolve;
  let reject;

  const promise = new Promise((nextResolve, nextReject) => {
    resolve = nextResolve;
    reject = nextReject;
  });

  return { promise, resolve, reject };
};

describe('LoginPage', () => {
  beforeEach(() => {
    loginMock.mockReset();
    useLocationMock.mockReset();
    useLocationMock.mockReturnValue({ pathname: '/login', state: null });
    sessionState = {
      isAuthenticated: false,
      isLoading: false,
      login: loginMock,
      session: null,
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('muestra el formulario vacio y elimina textos tecnicos de la pantalla', () => {
    render(<LoginPage />);

    expect(screen.getByLabelText('Correo electrónico')).toHaveValue('');
    expect(screen.getByLabelText('Contraseña')).toHaveValue('');
    expect(screen.getByText('Taller Zapata')).toBeInTheDocument();
    expect(screen.getByText('Todo el taller, en un solo lugar.')).toBeInTheDocument();
    expect(screen.queryByText(/Un front nuevo con reglas del backend/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/session/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/panel\/general/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/workspace/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Toasts y feedback/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Base tipo shadcn/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Bootstrap actual/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/GET \/api\/v1\/auth\/session/i)).not.toBeInTheDocument();
  });

  it('valida campos obligatorios antes de enviar', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(loginMock).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Completá correo electrónico y contraseña para continuar.');
    expect(screen.getByLabelText('Correo electrónico')).toHaveFocus();
  });

  it('envia el formulario con Enter', async () => {
    const user = userEvent.setup();
    loginMock.mockResolvedValue({ ok: true });
    render(<LoginPage />);

    await user.type(screen.getByLabelText('Correo electrónico'), ' admin@tallerzapata.com ');
    await user.type(screen.getByLabelText('Contraseña'), 'clave-segura{Enter}');

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith({ email: 'admin@tallerzapata.com', password: 'clave-segura' });
    });
  });

  it('muestra el estado Ingresando y evita envios duplicados', async () => {
    const user = userEvent.setup();
    const deferred = createDeferred();
    loginMock.mockReturnValue(deferred.promise);
    render(<LoginPage />);

    await user.type(screen.getByLabelText('Correo electrónico'), 'admin@tallerzapata.com');
    await user.type(screen.getByLabelText('Contraseña'), 'clave-segura');

    const submitButton = screen.getByRole('button', { name: 'Ingresar' });

    await user.click(submitButton);
    await user.click(screen.getByRole('button', { name: /Ingresando…/i }));

    expect(loginMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: /Ingresando…/i })).toBeDisabled();

    deferred.resolve({ ok: true });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Ingresar' })).toBeEnabled();
    });
  });

  it('muestra un mensaje claro cuando las credenciales son invalidas', async () => {
    const user = userEvent.setup();
    loginMock.mockRejectedValue({ httpStatus: 401 });
    render(<LoginPage />);

    await user.type(screen.getByLabelText('Correo electrónico'), 'admin@tallerzapata.com');
    await user.type(screen.getByLabelText('Contraseña'), 'incorrecta');
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos iniciar sesión. Revisá tus datos e intentá nuevamente.');
  });

  it('muestra un mensaje claro cuando falla la conexion', async () => {
    const user = userEvent.setup();
    loginMock.mockRejectedValue(new TypeError('Failed to fetch'));
    render(<LoginPage />);

    await user.type(screen.getByLabelText('Correo electrónico'), 'admin@tallerzapata.com');
    await user.type(screen.getByLabelText('Contraseña'), 'incorrecta');
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos conectarnos al sistema. Intentá nuevamente.');
  });

  it('permite mostrar y ocultar la contraseña sin perder el valor', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const passwordInput = screen.getByLabelText('Contraseña');

    await user.type(passwordInput, 'clave-segura');
    passwordInput.focus();

    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(screen.getByRole('button', { name: 'Mostrar contraseña' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Mostrar contraseña' }));

    expect(passwordInput).toHaveAttribute('type', 'text');
    expect(passwordInput).toHaveValue('clave-segura');
    expect(passwordInput).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Ocultar contraseña' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Ocultar contraseña' }));

    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(passwordInput).toHaveValue('clave-segura');
  });

  it('usa la accion de login actual cuando las credenciales son correctas', async () => {
    const user = userEvent.setup();
    loginMock.mockResolvedValue({ ok: true });
    render(<LoginPage />);

    await user.type(screen.getByLabelText('Correo electrónico'), 'admin@tallerzapata.com');
    await user.type(screen.getByLabelText('Contraseña'), 'clave-segura');
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith({ email: 'admin@tallerzapata.com', password: 'clave-segura' });
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('redirige al destino previo cuando el usuario ya esta autenticado', () => {
    sessionState = {
      isAuthenticated: true,
      isLoading: false,
      login: loginMock,
      session: null,
    };
    useLocationMock.mockReturnValue({ pathname: '/login', state: { from: '/cases/15' } });

    render(<LoginPage />);

    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/cases/15');
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-replace', 'true');
  });

  it('conserva la redireccion existente basada en la sesion autenticada', () => {
    sessionState = {
      isAuthenticated: true,
      isLoading: false,
      login: loginMock,
      session: {
        navigation: {
          defaultRoute: '/management',
        },
      },
    };

    render(<LoginPage />);

    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/management');
  });
});
