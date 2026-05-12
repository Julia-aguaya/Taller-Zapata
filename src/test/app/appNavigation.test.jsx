import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import App from '../../App';

const SESSION_STORAGE_KEY = 'tallerDemo.backendSession';

const storedSession = {
  accessToken: 'mock-access-token-12345',
  refreshToken: 'mock-refresh-token-67890',
  expiresInSeconds: 3600,
  savedAt: new Date().toISOString(),
  user: {
    id: 1,
    email: 'test@tallereszapata.com',
    displayName: 'Usuario Test',
    firstName: 'Usuario',
    lastName: 'Test',
    role: 'admin',
    branch: 'Z',
  },
};

describe('App navigation', () => {
  afterEach(() => {
    window.localStorage.clear();
    window.history.replaceState(null, '', '/');
  });

  it('abre la seccion Carpetas desde el menu autenticado', async () => {
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(storedSession));

    const user = userEvent.setup();
    render(<App />);

    await screen.findByRole('heading', { level: 2, name: 'Panel general' });

    await user.click(screen.getByRole('button', { name: 'Carpetas' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: 'Mis carpetas' })).toBeInTheDocument();
    });

    expect(screen.getByRole('heading', { level: 2, name: 'Panel de tus carpetas' })).toBeInTheDocument();
  });
});
