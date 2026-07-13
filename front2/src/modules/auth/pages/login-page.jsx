import { useMemo, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { useSession } from '@/modules/auth/providers/session-provider';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

export const LoginPage = () => {
  const { isAuthenticated, login, session, isLoading } = useSession();
  const location = useLocation();
  const [form, setForm] = useState({ email: 'admin@tallerzapata.local', password: 'password' });

  const destination = useMemo(
    () => location.state?.from || session?.navigation?.defaultRoute || '/panel',
    [location.state, session],
  );

  if (isAuthenticated) {
    return <Navigate to={destination} replace />;
  }

  const submit = async (event) => {
    event.preventDefault();
    await login(form);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(12,90,131,0.25),_transparent_34%),linear-gradient(160deg,_#0d2233_0%,_#13364f_45%,_#f4f7f8_45%,_#f4f7f8_100%)] px-4 py-12">
      <div className="absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle,_rgba(255,255,255,0.18)_0%,_transparent_65%)]" />
      <div className="relative grid w-full max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col justify-between rounded-[32px] border border-white/10 bg-slate-950/35 p-8 text-white shadow-haze backdrop-blur lg:p-10">
          <div className="space-y-5">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-200/80">Taller Zapata</p>
            <h1 className="max-w-xl font-serif text-5xl leading-tight tracking-tight">Un front nuevo con reglas del backend y no con parches en la UI.</h1>
            <p className="max-w-xl text-base text-slate-200/80">
              Login, panel y carpeta guiados por `session`, `panel/general` y `workspace`. Lo importante no es pintar botones; es dejar de mentirle al operador.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-white/15 bg-white/10 p-5 text-white backdrop-blur">
              <p className="text-sm font-semibold">Toasts y feedback</p>
              <p className="mt-2 text-sm text-slate-200/80">Sonner ya queda enchufado para flujos, errores y confirmaciones.</p>
            </Card>
            <Card className="border-white/15 bg-white/10 p-5 text-white backdrop-blur">
              <p className="text-sm font-semibold">Base tipo shadcn</p>
              <p className="mt-2 text-sm text-slate-200/80">Primitivas limpias con Tailwind, `cva` y composición lista para crecer.</p>
            </Card>
          </div>
        </div>

        <Card className="border-white/40 bg-card/90 p-8 shadow-haze backdrop-blur lg:p-10">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.26em] text-muted-foreground">Acceso</p>
              <h2 className="text-2xl font-semibold tracking-tight">Ingresá al panel</h2>
            </div>
          </div>

          <form className="space-y-5" onSubmit={submit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              />
            </div>

            <Button className="w-full" disabled={isLoading} type="submit">
              Entrar al sistema
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <div className="mt-8 rounded-2xl border border-border/70 bg-muted/60 p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Bootstrap actual</p>
            <p className="mt-1">Usa `GET /api/v1/auth/session` para armar shell, permisos, scopes y navegación sin waterfalls.</p>
          </div>
        </Card>
      </div>
    </div>
  );
};
