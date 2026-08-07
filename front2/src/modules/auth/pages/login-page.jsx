import { useMemo, useRef, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import {
  BriefcaseBusiness,
  CalendarCheck2,
  Eye,
  EyeOff,
  FolderKanban,
  LoaderCircle,
  ShieldCheck,
} from 'lucide-react';
import { useSession } from '@/modules/auth/providers/session-provider';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

const getInitialForm = () => ({
  email: import.meta.env.DEV ? import.meta.env.VITE_LOGIN_PREFILL_EMAIL || '' : '',
  password: import.meta.env.DEV ? import.meta.env.VITE_LOGIN_PREFILL_PASSWORD || '' : '',
});

const getLoginErrorMessage = (error) => {
  const httpStatus = Number(error?.httpStatus || 0);

  if ([400, 401, 403, 422].includes(httpStatus)) {
    return 'No pudimos iniciar sesión. Revisá tus datos e intentá nuevamente.';
  }

  if (error instanceof TypeError || httpStatus === 0) {
    return 'No pudimos conectarnos al sistema. Intentá nuevamente.';
  }

  return 'No pudimos iniciar sesión. Revisá tus datos e intentá nuevamente.';
};

const benefits = [
  { icon: FolderKanban, label: 'Carpetas y clientes' },
  { icon: CalendarCheck2, label: 'Agenda y tareas' },
  { icon: BriefcaseBusiness, label: 'Seguimiento de trámites' },
];

export const LoginPage = () => {
  const { isAuthenticated, login, session, isLoading } = useSession();
  const location = useLocation();
  const [form, setForm] = useState(() => getInitialForm());
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const destination = useMemo(
    () => location.state?.from || session?.navigation?.defaultRoute || '/panel',
    [location.state, session],
  );

  const busy = isLoading || isSubmitting;

  if (isAuthenticated) {
    return <Navigate to={destination} replace />;
  }

  const submit = async (event) => {
    event.preventDefault();

    if (busy) {
      return;
    }

    const email = form.email.trim();
    const password = form.password;

    if (!email || !password) {
      setFormError('Completá correo electrónico y contraseña para continuar.');
      if (!email) {
        emailRef.current?.focus();
      } else {
        passwordRef.current?.focus();
      }
      return;
    }

    setFormError('');
    setIsSubmitting(true);

    try {
      await login({ email, password });
    } catch (error) {
      setFormError(getLoginErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative grid min-h-[100dvh] place-items-center overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(14,116,144,0.14),_transparent_28%),linear-gradient(180deg,_#eef6fb_0%,_#f7fafc_100%)] px-5 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.5)_0%,rgba(255,255,255,0)_42%)]" />
      <div className="relative mx-auto grid w-full max-w-[1040px] items-center gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)] lg:gap-12 xl:gap-14">
        <section className="rounded-[30px] border border-cyan-300/20 bg-[linear-gradient(180deg,_rgba(8,47,73,0.98)_0%,_rgba(15,67,104,0.96)_100%)] p-6 text-white shadow-haze sm:p-8 lg:min-h-[520px] lg:px-10 lg:py-11">
          <div className="flex h-full flex-col justify-center gap-8 lg:gap-10">
            <div className="space-y-4 lg:space-y-5">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-100/90">Taller Zapata</p>
              <h1 className="max-w-md text-[2rem] font-semibold leading-tight tracking-tight sm:text-[2.35rem] lg:text-[2.65rem]">Todo el taller, en un solo lugar.</h1>
              <p className="max-w-xl text-sm leading-6 text-cyan-50/82 sm:text-base">
                Gestioná carpetas, clientes, vehículos y tareas desde un sistema simple y ordenado.
              </p>
            </div>

            <div className="hidden space-y-3 sm:block">
              {benefits.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-2xl border border-white/12 bg-white/10 px-4 py-3 text-sm text-cyan-50/92 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-300/12 text-cyan-100">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="flex items-center justify-center">
          <Card className="flex w-full max-w-[500px] flex-col justify-center rounded-[30px] border-white/70 bg-white/92 p-6 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.35)] backdrop-blur sm:p-8 lg:min-h-[520px] lg:px-10 lg:py-10">
            <div className="mb-5 flex items-start gap-4 lg:mb-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-600 text-white shadow-[0_12px_32px_-18px_rgba(8,145,178,0.8)]">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-700">Acceso al sistema</p>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Bienvenido/a</h2>
                <p className="text-sm text-slate-600">Ingresá con tu cuenta para continuar.</p>
              </div>
            </div>

            <form className="space-y-4" onSubmit={submit} noValidate>
              <div aria-live="assertive">
                {formError ? (
                  <p className="text-sm font-medium text-destructive" id="login-form-error" role="alert">
                    {formError}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700" htmlFor="email">Correo electrónico</Label>
                <Input
                  ref={emailRef}
                  aria-describedby={formError ? 'login-form-error' : undefined}
                  aria-invalid={Boolean(formError)}
                  autoComplete="email"
                  className="login-input h-12 rounded-2xl border-slate-200 bg-white text-base text-black placeholder:text-slate-400 shadow-none focus:border-cyan-500 focus:ring-cyan-500/20"
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, email: event.target.value }));
                    if (formError) {
                      setFormError('');
                    }
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700" htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    ref={passwordRef}
                    aria-describedby={formError ? 'login-form-error' : undefined}
                    aria-invalid={Boolean(formError)}
                    autoComplete="current-password"
                    className="login-input h-12 rounded-2xl border-slate-200 bg-white pr-12 text-base text-black placeholder:text-slate-400 shadow-none focus:border-cyan-500 focus:ring-cyan-500/20"
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(event) => {
                      setForm((current) => ({ ...current, password: event.target.value }));
                      if (formError) {
                        setFormError('');
                      }
                    }}
                  />
                  <button
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 motion-reduce:transition-none"
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => setShowPassword((current) => !current)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button className="mt-2 h-12 w-full rounded-2xl text-base text-white hover:text-white shadow-[0_18px_30px_-20px_rgba(8,145,178,0.75)] motion-safe:transition-colors motion-reduce:transition-none" disabled={busy} size="lg" type="submit">
                {busy ? (
                  <>
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" />
                    Ingresando…
                  </>
                ) : (
                  'Ingresar'
                )}
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-slate-500">Acceso exclusivo para personal autorizado.</p>
          </Card>
        </div>
      </div>
    </div>
  );
};
