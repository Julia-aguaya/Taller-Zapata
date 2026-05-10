import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, it, expect, afterEach } from 'vitest';
import { server } from '../../setupTests.js';

const mockUser = {
  id: 1,
  email: 'test@tallereszapata.com',
  displayName: 'Usuario Test',
  firstName: 'Usuario',
  lastName: 'Test',
  role: 'admin',
  branch: 'Z',
};

const mockSession = {
  accessToken: 'mock-access-token-12345',
  refreshToken: 'mock-refresh-token-67890',
  expiresInSeconds: 3600,
  user: mockUser,
};

function LoginForm({ onLoginSuccess }) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message);
        setLoading(false);
        return;
      }

      const data = await response.json();
      localStorage.setItem('session', JSON.stringify(data));
      onLoginSuccess?.(data);
      setLoading(false);
    } catch (err) {
      setError('Error de conexión');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} data-testid="login-form">
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="password">Contraseña</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {error && (
        <div role="alert" data-testid="error-message">
          {error}
        </div>
      )}
      <button type="submit" disabled={loading}>
        {loading ? 'Ingresando...' : 'Ingresar'}
      </button>
    </form>
  );
}

function AuthenticatedUI({ session, onLogout }) {
  return (
    <div data-testid="authenticated-ui">
      <header>
        <h1>Bienvenido, {session.user.displayName}</h1>
        <span data-testid="user-email">{session.user.email}</span>
      </header>
      <main>
        <p>Panel de случая</p>
      </main>
      <button onClick={onLogout} data-testid="logout-button">
        Cerrar sesión
      </button>
    </div>
  );
}

function GuestUI({ onLogin }) {
  return (
    <div data-testid="guest-ui">
      <h1>Iniciar sesión</h1>
      <LoginForm onLoginSuccess={onLogin} />
    </div>
  );
}

const React = require('react');

describe('Auth - Login', () => {
  afterEach(() => {
    server.resetHandlers();
    localStorage.clear();
  });

  it('debería mostrar UI autenticada después de login exitoso', async () => {
    const user = userEvent.setup();
    let authSession = null;

    function TestApp() {
      const [session, setSession] = React.useState(null);

      return session ? (
        <AuthenticatedUI session={session} onLogout={() => setSession(null)} />
      ) : (
        <GuestUI onLogin={(s) => setSession(s)} />
      );
    }

    render(<TestApp />);

    await user.type(screen.getByLabelText(/email/i), 'test@tallereszapata.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'password123');
    await user.click(screen.getByRole('button', { name: /ingresar/i }));

    await waitFor(() => {
      expect(screen.getByTestId('authenticated-ui')).toBeInTheDocument();
    });

    expect(screen.getByText(/bienvenido/i)).toBeInTheDocument();
    expect(screen.getByTestId('user-email')).toHaveTextContent('test@tallereszapata.com');
  });

  it('debería mostrar mensaje de error con credenciales inválidas (401)', async () => {
    server.use(
      http.post('/api/v1/auth/login', async ({ request }) => {
        const body = await request.json();

        if (
          body.email === 'test@tallereszapata.com' &&
          body.password === 'password123'
        ) {
          return HttpResponse.json(mockSession, { status: 200 });
        }

        return HttpResponse.json(
          { message: 'Credenciales inválidas' },
          { status: 401 }
        );
      })
    );

    const user = userEvent.setup();
    let authSession = null;

    function TestApp() {
      const [session, setSession] = React.useState(null);

      return session ? (
        <AuthenticatedUI session={session} onLogout={() => setSession(null)} />
      ) : (
        <GuestUI onLogin={(s) => setSession(s)} />
      );
    }

    render(<TestApp />);

    await user.type(screen.getByLabelText(/email/i), 'wrong@tallereszapata.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /ingresar/i }));

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });

    expect(screen.getByTestId('error-message')).toHaveTextContent('Credenciales inválidas');
  });

  it('debería limpiar sesión y volver a UI de guest cuando hace logout', async () => {
    const user = userEvent.setup();
    localStorage.setItem('session', JSON.stringify(mockSession));

    function TestApp() {
      const [session, setSession] = React.useState(
        JSON.parse(localStorage.getItem('session') || 'null')
      );

      return session ? (
        <AuthenticatedUI session={session} onLogout={() => {
          localStorage.removeItem('session');
          setSession(null);
        }} />
      ) : (
        <GuestUI onLogin={(s) => setSession(s)} />
      );
    }

    render(<TestApp />);

    await waitFor(() => {
      expect(screen.getByTestId('authenticated-ui')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('logout-button'));

    await waitFor(() => {
      expect(screen.getByTestId('guest-ui')).toBeInTheDocument();
    });

    expect(localStorage.getItem('session')).toBeNull();
  });

  it('debería cargar automáticamente sesión guardada en localStorage', async () => {
    localStorage.setItem('session', JSON.stringify(mockSession));

    function TestApp() {
      const [session, setSession] = React.useState(
        JSON.parse(localStorage.getItem('session') || 'null')
      );

      return session ? (
        <AuthenticatedUI session={session} onLogout={() => {
          localStorage.removeItem('session');
          setSession(null);
        }} />
      ) : (
        <GuestUI onLogin={(s) => setSession(s)} />
      );
    }

    render(<TestApp />);

    await waitFor(() => {
      expect(screen.getByTestId('authenticated-ui')).toBeInTheDocument();
    });

    expect(screen.getByText(/bienvenido/i)).toBeInTheDocument();
  });

  it('debería mostrar banner de expiración cuando sesión está expirada', async () => {
    const expiredSession = {
      ...mockSession,
      expiresInSeconds: -3600,
      savedAt: new Date(Date.now() - 7200000).toISOString(),
    };
    localStorage.setItem('session', JSON.stringify(expiredSession));

    function TestApp() {
      const [session, setSession] = React.useState(
        JSON.parse(localStorage.getItem('session') || 'null')
      );
      const [expired, setExpired] = React.useState(false);

      React.useEffect(() => {
        if (session) {
          const savedTime = new Date(session.savedAt).getTime();
          const expiresAt = savedTime + (session.expiresInSeconds * 1000);
          if (Date.now() > expiresAt) {
            setExpired(true);
          }
        }
      }, [session]);

      if (expired) {
        return (
          <div data-testid="expired-banner">
            <p>Tu sesión venció. Te vamos a redirigir al login...</p>
            <button onClick={() => {
              localStorage.removeItem('session');
              setSession(null);
              setExpired(false);
            }}>
              Volver al login
            </button>
          </div>
        );
      }

      return session ? (
        <AuthenticatedUI session={session} onLogout={() => {
          localStorage.removeItem('session');
          setSession(null);
        }} />
      ) : (
        <GuestUI onLogin={(s) => setSession(s)} />
      );
    }

    render(<TestApp />);

    await waitFor(() => {
      expect(screen.getByTestId('expired-banner')).toBeInTheDocument();
    });

    expect(screen.getByText(/sesión venció/i)).toBeInTheDocument();
  });
});
