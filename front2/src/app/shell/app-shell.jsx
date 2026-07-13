import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bell, CalendarDays, ChevronLeft, ChevronRight, FolderOpen, FolderPlus, LayoutGrid, LogOut, Menu, Moon, Settings2, Sun, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
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

export const AppShell = () => {
  const { session, logout } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    const stored = window.localStorage.getItem('front2.dark');
    if (stored !== null) return stored === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    window.localStorage.setItem('front2.dark', String(dark));
  }, [dark]);

  const navigationItems = useMemo(
    () => (session?.navigation?.items ?? []).filter((item) => item.enabled),
    [session],
  );

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const toggleCollapse = () => setSidebarCollapsed((prev) => !prev);

  const currentPage = navigationItems.find((item) => item.path === location.pathname);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-hero-grid bg-[length:120px_120px] opacity-70" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-[1600px] flex-col gap-4 p-4 md:flex-row md:p-6">
        {/* Overlay mobile */}
        {sidebarOpen ? (
          <div className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm md:hidden" onClick={() => setSidebarOpen(false)} />
        ) : null}

        {/* Sidebar */}
        <Card
          className={[
            'fixed inset-y-0 left-0 z-50 w-72 border-white/50 bg-[#487fa7db] dark:bg-card/95 p-4 shadow-haze backdrop-blur transition-transform md:relative md:inset-auto md:z-auto',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
            sidebarCollapsed ? 'md:w-[68px]' : 'md:w-72',
          ].join(' ')}
        >
          <div className={['mb-6 flex items-center', sidebarCollapsed ? 'justify-center' : 'justify-between'].join(' ')}>
            {!sidebarCollapsed ? (
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/80 dark:text-muted-foreground">Taller Zapata</p>
            ) : null}
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="hidden rounded-xl p-1.5 text-white/70 transition hover:bg-white/20 hover:text-white dark:text-muted-foreground dark:hover:bg-accent dark:hover:text-foreground md:flex"
                onClick={toggleCollapse}
              >
                {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </button>
              <button
                type="button"
                className="rounded-xl p-1.5 text-muted-foreground transition hover:bg-accent hover:text-foreground md:hidden"
                onClick={toggleSidebar}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <nav className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = iconMap[item.code] ?? LayoutGrid;
              const isActive = location.pathname === item.path;

              return (
                <button
                  key={item.code}
                  className={[
                    'flex w-full items-center rounded-2xl border px-3 py-3 text-left transition',
                    sidebarCollapsed ? 'justify-center' : 'justify-between',
                    isActive
                      ? 'border-white/40 bg-white/20 text-white'
                      : 'border-transparent text-white/80 hover:border-white/30 hover:bg-white/10 dark:bg-background/70 dark:text-foreground dark:hover:border-border/60 dark:hover:bg-accent/60',
                  ].join(' ')}
                  onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                  type="button"
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <span className={['flex items-center gap-3 font-medium', sidebarCollapsed ? '' : ''].join(' ')}>
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className={sidebarCollapsed ? 'md:hidden' : ''}>{item.label}</span>
                  </span>
                  {!sidebarCollapsed && item.code === 'PANEL' && (session?.unreadNotifications ?? 0) > 0 ? (
                    <Badge variant="destructive">{session.unreadNotifications}</Badge>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </Card>

        {/* Main area */}
        <div className="flex min-h-[70vh] flex-1 flex-col gap-4">
          <header className="rounded-[28px] border border-white/40 bg-card/85 px-5 py-3 shadow-haze backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                className="rounded-xl p-1.5 text-white/70 transition hover:bg-white/20 hover:text-white dark:text-muted-foreground dark:hover:bg-accent dark:hover:text-foreground md:hidden"
                  onClick={toggleSidebar}
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Operación</p>
                  <h2 className="text-lg font-semibold tracking-tight">{currentPage?.label || 'Taller Zapata'}</h2>
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
                  onClick={() => setDark((d) => !d)}
                  title={dark ? 'Modo claro' : 'Modo oscuro'}
                >
                  {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
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

          <main className="flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
