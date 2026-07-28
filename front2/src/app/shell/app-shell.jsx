import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bell, Building2, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, FolderOpen, FolderPlus, LayoutGrid, LogOut, Menu, Moon, Settings2, ShieldCheck, Sun, UserRound, UsersRound, CarFront, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from '@/app/theme/theme-provider';
import { useSession } from '@/modules/auth/providers/session-provider';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';

const iconMap = {
  PANEL: LayoutGrid,
  CASES: FolderOpen,
  NEW_CASE: FolderPlus,
  AGENDA: CalendarDays,
  MANAGEMENT: Settings2,
};

const labelMap = {
  PANEL: 'Panel general',
  CASES: 'Carpetas',
  NEW_CASE: 'Nuevo caso',
  AGENDA: 'Agenda y tareas',
  MANAGEMENT: 'Gestión',
};

const sidebarLabelMap = { AGENDA: 'Agenda' };

const PRIMARY_NAV_CODES = ['PANEL', 'NEW_CASE', 'CASES', 'AGENDA', 'MANAGEMENT'];
const MANAGEMENT_ITEMS = [
  { code: 'CLIENTS', label: 'Clientes', path: '/management/clients', icon: UsersRound },
  { code: 'VEHICLES', label: 'Vehículos', path: '/management/vehicles', icon: CarFront },
  { code: 'REFERRERS', label: 'Referenciadores', path: '/management/referrers', icon: UserRound },
  { code: 'INSURANCE', label: 'Compañías de seguros', path: '/management/insurance', icon: ShieldCheck },
  { code: 'SUPPLIERS', label: 'Proveedores', unavailable: true, icon: Building2 },
  { code: 'ORGANIZATION', label: 'Taller y sucursales', path: '/management/organization', icon: Building2 },
];

const normalizePathname = (pathname) => {
  const normalized = String(pathname || '/').split(/[?#]/)[0].replace(/\/+$/, '');
  return normalized || '/';
};

// Keep all active-menu rules here so nested routes cannot activate competing items.
export const resolveActiveNavigation = (pathname) => {
  const path = normalizePathname(pathname);

  if (path === '/panel') return { primaryCode: 'PANEL', isManagementRoute: false };
  if (path === '/cases/new' || path.startsWith('/cases/new/')) return { primaryCode: 'NEW_CASE', isManagementRoute: false };
  if (path === '/cases' || path.startsWith('/cases/')) return { primaryCode: 'CASES', isManagementRoute: false };
  if (path === '/agenda' || path.startsWith('/agenda/')) return { primaryCode: 'AGENDA', isManagementRoute: false };

  const managementItem = MANAGEMENT_ITEMS.find((item) => item.path && (path === item.path || path.startsWith(`${item.path}/`)));
  if (managementItem) return { primaryCode: null, managementCode: managementItem.code, isManagementRoute: true };

  return { primaryCode: null, isManagementRoute: false };
};


export const AppShell = () => {
  const { session, logout } = useSession();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const menuTriggerRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isDark = theme === 'dark';

  const navigationItems = useMemo(
    () => (session?.navigation?.items ?? []).filter((item) => item.enabled),
    [session],
  );
  const navigationMap = useMemo(
    () => navigationItems.reduce((accumulator, item) => ({ ...accumulator, [item.code]: item }), {}),
    [navigationItems],
  );
  const primaryNavigationItems = useMemo(
    () => PRIMARY_NAV_CODES.map((code) => navigationMap[code]).filter(Boolean),
    [navigationMap],
  );
  const managementNavigationItems = useMemo(
    () => navigationMap.MANAGEMENT ? MANAGEMENT_ITEMS : [],
    [navigationMap],
  );

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const toggleCollapse = () => setSidebarCollapsed((prev) => !prev);

  const activeNavigation = resolveActiveNavigation(location.pathname);
  const activeManagementItem = managementNavigationItems.find((item) => item.code === activeNavigation.managementCode);
  const [managementExpanded, setManagementExpanded] = useState(false);
  const activePrimaryCode = activeNavigation.primaryCode;
  const currentPage = navigationMap[activePrimaryCode];
  const currentPageLabel = activeManagementItem?.label || labelMap[currentPage?.code] || currentPage?.label || 'Taller Zapata';
  const isManagementExpanded = !sidebarCollapsed && (activeNavigation.isManagementRoute || managementExpanded);

  useEffect(() => {
    if (!sidebarOpen) return undefined;
    const onEscape = (event) => {
      if (event.key === 'Escape') {
        setSidebarOpen(false);
        menuTriggerRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [sidebarOpen]);

  const closeMobileSidebar = () => {
    setSidebarOpen(false);
    menuTriggerRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-hero-grid bg-[length:120px_120px] opacity-70" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-[1600px] flex-col gap-4 p-4 md:flex-row md:p-6">
        {/* Overlay mobile */}
        {sidebarOpen ? (
          <button type="button" className="fixed inset-0 z-40 bg-[hsl(var(--shell-overlay)/0.4)] backdrop-blur-sm md:hidden" aria-label="Cerrar menú de navegación" onClick={closeMobileSidebar} />
        ) : null}

        {/* Sidebar */}
        <Card
          id="sidebar-navigation"
          aria-label="Navegación lateral"
          className={[
            'fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto border border-[hsl(var(--shell-sidebar-border)/0.8)] bg-[hsl(var(--shell-sidebar-bg)/0.92)] text-[hsl(var(--shell-sidebar-foreground))] p-4 shadow-haze backdrop-blur transition-[transform,width] duration-200 motion-reduce:transition-none md:relative md:inset-auto md:z-auto',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
            sidebarCollapsed ? 'md:w-[68px]' : 'md:w-72',
          ].join(' ')}
        >
          <div className={['mb-6 flex items-center', sidebarCollapsed ? 'justify-center' : 'justify-between'].join(' ')}>
            {!sidebarCollapsed ? (
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[hsl(var(--shell-sidebar-muted))]">Taller Zapata</p>
            ) : null}
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="hidden rounded-xl p-2 text-[hsl(var(--shell-sidebar-muted))] transition hover:bg-[hsl(var(--shell-sidebar-hover-bg)/0.16)] hover:text-[hsl(var(--shell-sidebar-hover))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white md:flex"
                onClick={toggleCollapse}
                aria-label={sidebarCollapsed ? 'Expandir navegación' : 'Contraer navegación'}
              >
                {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </button>
              <button
                type="button"
                className="rounded-xl p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white md:hidden"
                onClick={closeMobileSidebar}
                aria-label="Cerrar menú de navegación"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <nav className="space-y-2" aria-label="Menu principal">
            {primaryNavigationItems.map((item) => {
              const Icon = iconMap[item.code] ?? LayoutGrid;
              const isActive = activePrimaryCode === item.code;
              const isCurrentPage = isActive && item.code !== 'MANAGEMENT';
              const isManagementGroupActive = item.code === 'MANAGEMENT' && activeNavigation.isManagementRoute;

              return (
                <button
                  key={item.code}
                  className={[
                    'flex min-h-11 w-full items-center rounded-2xl border px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
                    sidebarCollapsed ? 'justify-center' : 'justify-between',
                    (isActive || isManagementGroupActive)
                      ? 'border-[hsl(var(--shell-sidebar-foreground)/0.2)] bg-[hsl(var(--shell-sidebar-active-bg)/0.18)] text-[hsl(var(--shell-sidebar-foreground))]'
                      : 'border-transparent text-[hsl(var(--shell-sidebar-muted))] hover:border-[hsl(var(--shell-sidebar-foreground)/0.16)] hover:bg-[hsl(var(--shell-sidebar-hover-bg)/0.12)] hover:text-[hsl(var(--shell-sidebar-hover))]',
                  ].join(' ')}
                  onClick={() => {
                    if (item.code === 'MANAGEMENT') {
                      setManagementExpanded((expanded) => !expanded);
                    } else {
                      navigate(item.path);
                      closeMobileSidebar();
                    }
                  }}
                  type="button"
                  title={sidebarCollapsed ? (labelMap[item.code] || item.label) : undefined}
                   aria-current={isCurrentPage ? 'page' : undefined}
                  aria-expanded={item.code === 'MANAGEMENT' && !sidebarCollapsed ? isManagementExpanded : undefined}
                  aria-controls={item.code === 'MANAGEMENT' && !sidebarCollapsed ? 'management-submenu' : undefined}
                >
                  <span className={['flex items-center gap-3 font-medium', sidebarCollapsed ? '' : ''].join(' ')}>
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className={sidebarCollapsed ? 'md:hidden' : ''}>{sidebarLabelMap[item.code] || labelMap[item.code] || item.label}</span>
                  </span>
                  {item.code === 'MANAGEMENT' && !sidebarCollapsed ? <ChevronDown className={['h-4 w-4 transition-transform duration-200 motion-reduce:transition-none', isManagementExpanded ? 'rotate-180' : ''].join(' ')} aria-hidden="true" /> : null}
                </button>
              );
            })}
          </nav>

          {isManagementExpanded ? (
            <div id="management-submenu" className="mt-5 space-y-2 rounded-3xl border border-[hsl(var(--shell-sidebar-foreground)/0.12)] bg-[hsl(var(--shell-sidebar-panel-bg)/0.9)] p-3 text-[hsl(var(--shell-sidebar-foreground))]" aria-label="Subsecciones de gestión">
                      {managementNavigationItems.map((item) => {
                        const Icon = item.icon;
                         const isActive = item.code === activeNavigation.managementCode;

                        if (item.unavailable) {
                          return <button key={item.code} type="button" disabled aria-label="Proveedores" aria-describedby="providers-unavailable" className="flex min-h-11 w-full cursor-not-allowed items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm text-[hsl(var(--shell-sidebar-muted)/0.65)]"><Icon className="h-4 w-4 flex-shrink-0" /><span>Proveedores</span><span id="providers-unavailable" className="sr-only">No disponible: falta el contrato backend de proveedores.</span></button>;
                        }

                        return (
                          <button
                            key={item.code}
                            type="button"
                            className={[
                              'flex min-h-11 w-full items-center rounded-2xl border px-3 py-2.5 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
                              isActive
                                ? 'border-[hsl(var(--shell-sidebar-foreground)/0.18)] bg-[hsl(var(--shell-sidebar-active-bg)/0.14)] text-[hsl(var(--shell-sidebar-foreground))]'
                                : 'border-transparent text-[hsl(var(--shell-sidebar-muted))] hover:border-[hsl(var(--shell-sidebar-foreground)/0.14)] hover:bg-[hsl(var(--shell-sidebar-hover-bg)/0.1)] hover:text-[hsl(var(--shell-sidebar-hover))]',
                            ].join(' ')}
                            onClick={() => {
                              navigate(item.path);
                              closeMobileSidebar();
                            }}
                            aria-current={isActive ? 'page' : undefined}
                          >
                            <span className="flex items-center gap-3">
                              <Icon className="h-4 w-4 flex-shrink-0" />
                              <span>{item.label}</span>
                            </span>
                          </button>
                        );
                      })}
            </div>
          ) : null}
        </Card>

        {/* Main area */}
        <div className="flex min-h-[70vh] flex-1 flex-col gap-4">
          <header className="rounded-[28px] border border-white/40 bg-card/85 px-5 py-3 shadow-haze backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  ref={menuTriggerRef}
                  type="button"
                  className="rounded-xl p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
                  onClick={toggleSidebar}
                  aria-label={sidebarOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'}
                  aria-expanded={sidebarOpen}
                  aria-controls="sidebar-navigation"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Operación</p>
                  <h2 className="text-lg font-semibold tracking-tight">{currentPageLabel}</h2>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="hidden rounded-2xl border border-border/60 bg-background/60 px-3 py-1.5 text-sm sm:flex items-center gap-2">
                  <span className="text-muted-foreground">{session?.user?.displayName}</span>
                  <Badge variant="secondary" className="text-[10px]">{session?.user?.role}</Badge>
                </div>
                <button
                  type="button"
                  className="rounded-2xl border border-border/60 bg-background/60 px-3 py-1.5 text-sm transition hover:bg-accent/50"
                  onClick={toggleTheme}
                  title={isDark ? 'Activar tema claro' : 'Activar tema oscuro'}
                  aria-label={isDark ? 'Activar tema claro' : 'Activar tema oscuro'}
                >
                  {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  className="relative rounded-2xl border border-border/60 bg-background/60 px-3 py-1.5 text-sm transition hover:bg-accent/50"
                  onClick={() => navigate('/panel')}
                >
                  <Bell className="h-4 w-4" />
                  {(session?.unreadNotifications ?? 0) > 0 ? (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                      {session.unreadNotifications}
                    </span>
                  ) : null}
                </button>
                <Button variant="outline" size="sm" className="border-destructive/40 text-destructive hover:bg-destructive/10" onClick={logout}>
                  <LogOut className="mr-1.5 h-3.5 w-3.5" />
                  Cerrar sesión
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1" tabIndex="-1">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
