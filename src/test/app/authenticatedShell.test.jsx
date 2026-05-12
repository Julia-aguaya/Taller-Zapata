import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import AuthenticatedAppShell from '../../app/AuthenticatedAppShell';
import BlockingDocGateModal from '../../app/BlockingDocGateModal';
import { NAV_ITEMS, getActiveViewTitle } from '../../app/authenticatedShellConfig';

describe('authenticatedShellConfig', () => {
  it('returns the expected title for each shell view', () => {
    expect(getActiveViewTitle('panel')).toBe('Panel general');
    expect(getActiveViewTitle('carpetas')).toBe('Mis carpetas');
    expect(getActiveViewTitle('agenda')).toBe('Agenda de tareas');
    expect(getActiveViewTitle('nuevo')).toBe('Nuevo caso');
    expect(getActiveViewTitle('gestion')).toBe('Gestión de trámites');
  });
});

describe('AuthenticatedAppShell', () => {
  it('renders the passive authenticated shell without owning logic', async () => {
    const user = userEvent.setup();
    const onOpenView = vi.fn();
    const onLogout = vi.fn();

    render(
      <AuthenticatedAppShell
        activeView="panel"
        activeViewTitle={getActiveViewTitle('panel')}
        backendSession={{ email: 'asesor@delta.com' }}
        navItems={NAV_ITEMS}
        notice={{ title: 'Listo', message: 'Se guardo el cambio.', tone: 'success' }}
        onLogout={onLogout}
        onOpenView={onOpenView}
        sessionExpiryNotice="Tu sesion esta por vencer."
        sessionExpirySeconds={8}
        unreadCount={3}
        unreadCountSource="api"
      >
        <section>Contenido autenticado</section>
      </AuthenticatedAppShell>
    );

    expect(screen.getByText('Delta Taller')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Panel general' })).toBeInTheDocument();
    expect(screen.getByText('Contenido autenticado')).toBeInTheDocument();
    expect(screen.getByText('Listo')).toBeInTheDocument();
    expect(screen.getByText('Tu sesion esta por vencer.')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Carpetas' }));
    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }));

    expect(onOpenView).toHaveBeenCalledWith('carpetas');
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it('renders a short notice without empty secondary copy', () => {
    render(
      <AuthenticatedAppShell
        activeView="panel"
        activeViewTitle={getActiveViewTitle('panel')}
        backendSession={{ email: 'asesor@delta.com' }}
        navItems={NAV_ITEMS}
        notice={{ title: 'Cambios guardados', tone: 'success' }}
        onLogout={vi.fn()}
        onOpenView={vi.fn()}
        sessionExpiryNotice=""
        sessionExpirySeconds={0}
        unreadCount={0}
        unreadCountSource="api"
      >
        <section>Contenido autenticado</section>
      </AuthenticatedAppShell>
    );

    expect(screen.getByText('Cambios guardados')).toBeInTheDocument();
    expect(screen.queryByText('undefined')).not.toBeInTheDocument();
  });
});

describe('BlockingDocGateModal', () => {
  it('renders only when open and delegates acceptance', async () => {
    const user = userEvent.setup();
    const onAccept = vi.fn();

    const { rerender } = render(
      <BlockingDocGateModal isOpen={false} message="Pendiente" onAccept={onAccept} />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    rerender(
      <BlockingDocGateModal
        isOpen
        message="La carpeta sigue marcada como incompleta."
        onAccept={onAccept}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('La carpeta sigue marcada como incompleta.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Aceptar' }));

    expect(onAccept).toHaveBeenCalledTimes(1);
  });
});
