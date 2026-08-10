import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, FolderPlus, Search, UserPlus, Car } from 'lucide-react';
import { toast } from 'sonner';
import { createCase, createPerson, createVehicle, getCaseCatalogs, getPersonVehicles, getVehicleCatalogs, listBranches, listOrganizations, listVehicleBrands, listVehicleModels, searchPersons, searchVehicles } from '@/modules/cases/api/new-case-api';
import { searchReferenciadores } from '@/modules/cases/api/cases-api';
import { useSession } from '@/modules/auth/providers/session-provider';
import { Card } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Button } from '@/shared/ui/button';
import { Textarea } from '@/shared/ui/textarea';
import { Badge } from '@/shared/ui/badge';
import { Dialog } from '@/shared/ui/dialog';

const createInitialState = () => ({
  caseTypeId: 1,
  organizationId: '',
  branchId: '',
  referenced: 'NO',
  referredByText: '',
  generalObservations: '',
  person: {
    nombre: '',
    apellido: '',
    telefonoPrincipal: '',
    emailPrincipal: '',
    numeroDocumento: '',
  },
  vehicle: {
    brandText: '',
    modelText: '',
    plate: '',
    year: '',
    vehicleTypeCode: 'SEDAN',
    usageCode: 'PARTICULAR',
    transmissionCode: 'MANUAL',
    color: '',
    observaciones: '',
  },
});

export const requiresReferenciador = (referenced, referenciadorId) => referenced === 'SI' && !referenciadorId;

export const NewCasePage = () => {
  const [createdCase, setCreatedCase] = useState(null);

  const navigate = useNavigate();
  const { session } = useSession();
  const [selectedPersonId, setSelectedPersonId] = useState(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [personSearch, setPersonSearch] = useState('');
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [referenciadorSearch, setReferenciadorSearch] = useState('');
  const [selectedReferenciadorId, setSelectedReferenciadorId] = useState(null);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState(createInitialState());
  const [referenciadorSearchDebounced, setReferenciadorSearchDebounced] = useState('');
  const [selectedReferenciador, setSelectedReferenciador] = useState(null);

  const personDebounced = personSearch.trim();
  const vehicleDebounced = vehicleSearch.trim();

  useEffect(() => {
    const timer = window.setTimeout(() => setReferenciadorSearchDebounced(referenciadorSearch.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [referenciadorSearch]);

  const personSearchQuery = useQuery({
    queryKey: ['persons', 'search', personDebounced],
    queryFn: () => searchPersons({ q: personDebounced }),
    enabled: personDebounced.length >= 2 && !selectedPersonId,
  });

  const vehicleSearchQuery = useQuery({
    queryKey: ['vehicles', 'search', vehicleDebounced],
    queryFn: () => searchVehicles({ q: vehicleDebounced }),
    enabled: vehicleDebounced.length >= 2 && !selectedVehicleId,
  });

  const referenciadorQuery = useQuery({
    queryKey: ['referenciadores', 'search', referenciadorSearchDebounced],
    queryFn: () => searchReferenciadores(referenciadorSearchDebounced),
    enabled: referenciadorSearchDebounced.length >= 2 && !selectedReferenciadorId,
  });

  const selectedReferenciadorQuery = useQuery({
    queryKey: ['referenciadores', 'selected', selectedReferenciadorId],
    queryFn: () => searchReferenciadores(''),
    enabled: !!selectedReferenciadorId,
    select: (data) => data?.find(r => r.id === selectedReferenciadorId),
  });

  const linkedVehiclesQuery = useQuery({
    queryKey: ['persons', selectedPersonId, 'vehicles'],
    queryFn: () => getPersonVehicles(selectedPersonId),
    enabled: Boolean(selectedPersonId) && !selectedVehicleId,
  });

  const resolvedScope = useMemo(() => {
    const scopes = session?.scopes ?? [];
    const uniqueOrgs = [...new Set(scopes.map((s) => s.organizationId).filter(Boolean))];
    const uniqueOrgId = uniqueOrgs.length === 1 ? uniqueOrgs[0] : null;
    if (!uniqueOrgId) return { organizationId: null, branchId: null, resolved: false };
    const orgBranches = scopes.filter((s) => s.organizationId === uniqueOrgId && s.branchId);
    const uniqueBranchId = orgBranches.length === 1 ? orgBranches[0].branchId : null;
    return { organizationId: uniqueOrgId, branchId: uniqueBranchId, branchCode: uniqueBranchId ? orgBranches[0]?.branchCode : null, branchName: uniqueBranchId ? orgBranches[0]?.branchName : null, resolved: uniqueBranchId !== null };
  }, [session]);

  const showOrgSelector = resolvedScope.organizationId === null;

  const organizationsQuery = useQuery({
    queryKey: ['identity', 'organizations'],
    queryFn: listOrganizations,
    enabled: showOrgSelector,
  });

  const caseCatalogsQuery = useQuery({
    queryKey: ['cases', 'catalogs'],
    queryFn: getCaseCatalogs,
  });

  const brandsQuery = useQuery({
    queryKey: ['vehicles', 'brands'],
    queryFn: listVehicleBrands,
  });

  const vehicleCatalogsQuery = useQuery({
    queryKey: ['vehicles', 'catalogs'],
    queryFn: getVehicleCatalogs,
  });

  const selectedBrand = useMemo(
    () => (brandsQuery.data ?? []).find((brand) => brand.nombre === form.vehicle.brandText),
    [brandsQuery.data, form.vehicle.brandText],
  );

  const modelsQuery = useQuery({
    queryKey: ['vehicles', 'models', selectedBrand?.id ?? 'all'],
    queryFn: () => listVehicleModels(selectedBrand?.id),
    enabled: brandsQuery.isSuccess,
  });

  const organizationIdForBranches = form.organizationId || resolvedScope.organizationId || '';
  const branchesQuery = useQuery({
    queryKey: ['identity', 'branches', organizationIdForBranches],
    queryFn: () => listBranches(organizationIdForBranches),
    enabled: Boolean(organizationIdForBranches) && resolvedScope.organizationId !== null && resolvedScope.branchId === null,
  });

  useEffect(() => {
    if (resolvedScope.resolved) {
      setForm((current) => ({
        ...current,
        organizationId: resolvedScope.organizationId,
        branchId: resolvedScope.branchId,
      }));
    } else if (resolvedScope.organizationId && !resolvedScope.branchId) {
      setForm((current) => ({
        ...current,
        organizationId: resolvedScope.organizationId,
      }));
    }
  }, [resolvedScope]);

  const createCaseMutation = useMutation({
    mutationFn: async () => {
      let personId = selectedPersonId;
      if (!personId) {
        try {
          const person = await createPerson({
            tipoPersona: 'fisica',
            nombre: form.person.nombre,
            apellido: form.person.apellido,
            razonSocial: null,
            tipoDocumentoCodigo: 'DNI',
            numeroDocumento: form.person.numeroDocumento || null,
            cuitCuil: null,
            fechaNacimiento: null,
            telefonoPrincipal: form.person.telefonoPrincipal || null,
            emailPrincipal: form.person.emailPrincipal || null,
            ocupacion: null,
            observaciones: null,
            activo: true,
          });
          personId = person.id;
        } catch (personError) {
          if (personError.message?.includes('duplicado') || personError.message?.includes('already exists') || personError.message?.includes('uq_personas')) {
            const existing = await searchPersons({ document: form.person.numeroDocumento });
            if (existing.length === 1) {
              personId = existing[0].id;
              setSelectedPersonId(personId);
              toast.message('El cliente ya existía. Lo vinculamos automáticamente.', { duration: 4000 });
            } else {
              throw personError;
            }
          } else {
            throw personError;
          }
        }
      }

      let vehicleId = selectedVehicleId;
      if (!vehicleId) {
        try {
          const vehicle = await createVehicle({
            brandId: selectedBrand?.id ?? null,
            modelId: (modelsQuery.data ?? []).find((model) => model.nombre === form.vehicle.modelText)?.id ?? null,
            brandText: form.vehicle.brandText,
            modelText: form.vehicle.modelText,
            plate: form.vehicle.plate,
            year: form.vehicle.year ? Number(form.vehicle.year) : null,
            vehicleTypeCode: form.vehicle.vehicleTypeCode,
            usageCode: form.vehicle.usageCode,
            color: form.vehicle.color || null,
            paintCode: null,
            chasis: null,
            motor: null,
            transmissionCode: form.vehicle.transmissionCode,
            mileage: null,
            observaciones: form.vehicle.observaciones || null,
            activo: true,
          });
          vehicleId = vehicle.id;
        } catch (vehicleError) {
          if (vehicleError.message?.includes('duplicado') || vehicleError.message?.includes('already exists') || vehicleError.message?.includes('dominio')) {
            const existing = await searchVehicles({ plate: form.vehicle.plate });
            if (existing.length === 1) {
              vehicleId = existing[0].id;
              setSelectedVehicleId(vehicleId);
              toast.message('El vehículo ya existía. Lo vinculamos automáticamente.', { duration: 4000 });
            } else {
              throw vehicleError;
            }
          } else {
            throw vehicleError;
          }
        }
      }

      return createCase({
        caseTypeId: Number(form.caseTypeId),
        organizationId: form.organizationId ? Number(form.organizationId) : null,
        branchId: form.branchId ? Number(form.branchId) : null,
        principalVehicleId: vehicleId,
        principalCustomerPersonId: personId,
        referenciadorId: selectedReferenciadorId,
        referenced: form.referenced === 'SI',
        referredByPersonId: null,
        referredByText: form.referenced === 'SI' ? form.referredByText || null : null,
        priorityCode: null,
        generalObservations: form.generalObservations || null,
        incidentDate: null,
        incidentTime: null,
        incidentPlace: null,
        incidentDynamics: null,
        incidentObservations: null,
        prescriptionDate: null,
        daysInProcess: null,
        customerRoleCode: 'CLIENTE',
        principalVehicleRoleCode: 'PRINCIPAL',
      });
    },
    onSuccess: (payload) => {
      setCreatedCase(payload);
    },
    onError: (error) => {
      toast.error(error.message || 'No pude crear la carpeta.');
    },
  });

  const submit = async (event) => {
    event.preventDefault();

    const fieldErrors = {};
    if (showOrgSelector && !form.organizationId) fieldErrors.organizacion = 'Seleccioná una organización';
    if (resolvedScope.organizationId && resolvedScope.branchId === null && !form.branchId) fieldErrors.sucursal = 'Seleccioná una sucursal';
    if (!selectedPersonId) {
      if (!form.person.nombre?.trim()) fieldErrors.personNombre = 'El nombre es obligatorio';
      if (!form.person.apellido?.trim()) fieldErrors.personApellido = 'El apellido es obligatorio';
    }
    if (!selectedVehicleId) {
      if (!form.vehicle.brandText?.trim()) fieldErrors.vehicleMarca = 'La marca es obligatoria';
      if (!form.vehicle.modelText?.trim()) fieldErrors.vehicleModelo = 'El modelo es obligatorio';
      if (!form.vehicle.plate?.trim()) fieldErrors.vehiclePatente = 'El dominio es obligatorio';
    }
    if (requiresReferenciador(form.referenced, selectedReferenciadorId)) fieldErrors.referenciador = 'Seleccioná un referenciador activo';

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      toast.error('Completá los campos obligatorios antes de crear la carpeta.');
      return;
    }

    setErrors({});
    await createCaseMutation.mutateAsync();
  };

  const caseTypeOptions = caseCatalogsQuery.data?.caseTypes ?? [];
  const brandOptions = brandsQuery.data ?? [];
  const modelOptions = modelsQuery.data ?? [];
  const vehicleTypeOptions = vehicleCatalogsQuery.data?.vehicleTypeCodes ?? [];
  const usageOptions = vehicleCatalogsQuery.data?.usageCodes ?? [];
  const transmissionOptions = vehicleCatalogsQuery.data?.transmissionCodes ?? [];

  const caseTypeName = useMemo(() => {
    const selected = caseTypeOptions.find((ct) => ct.id === form.caseTypeId);
    return selected?.name || 'Particular';
  }, [caseTypeOptions, form.caseTypeId]);

  const blockingReasons = useMemo(() => {
    const reasons = [];
    if (showOrgSelector && !form.organizationId) reasons.push('Falta seleccionar la organización');
    if (resolvedScope.organizationId && resolvedScope.branchId === null && !form.branchId) reasons.push('Falta seleccionar la sucursal');
    if (!selectedPersonId) {
      if (!form.person.nombre?.trim()) reasons.push('Falta el nombre del cliente');
      if (!form.person.apellido?.trim()) reasons.push('Falta el apellido del cliente');
    }
    if (!selectedVehicleId) {
      if (!form.vehicle.brandText?.trim()) reasons.push('Falta la marca del vehículo');
      if (!form.vehicle.modelText?.trim()) reasons.push('Falta el modelo del vehículo');
      if (!form.vehicle.plate?.trim()) reasons.push('Falta el dominio del vehículo');
    }
    if (requiresReferenciador(form.referenced, selectedReferenciadorId)) reasons.push('Falta seleccionar el referenciador');
    return reasons;
  }, [form, selectedPersonId, selectedVehicleId, showOrgSelector, resolvedScope]);

  return (
    <div className="space-y-5">
      <section>
        <Card className="border-white/50 bg-card/90 p-6 shadow-haze">
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Nuevo caso</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">Alta mínima</h2>
            </div>
          </div>
        </Card>
      </section>

      <form className="space-y-5" onSubmit={submit}>
        <Card className="border-white/50 bg-card/90 p-6 shadow-haze">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-2xl font-semibold tracking-tight">Datos del trámite</h3>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Tipo de trámite">
                <Select value={String(form.caseTypeId)} onChange={(event) => setForm((current) => ({ ...current, caseTypeId: Number(event.target.value) }))}>
                {caseTypeOptions.map((option) => (
                  <option key={option.id} value={option.id}>{option.name}</option>
                ))}
              </Select>
            </Field>

            {showOrgSelector ? (
              <Field label="Organizacion">
                <Select className={errors.organizacion ? 'border-destructive ring-1 ring-destructive' : ''} value={String(form.organizationId)} onChange={(event) => setForm((current) => ({ ...current, organizationId: event.target.value, branchId: '' }))}>
                  <option value="">Seleccionar</option>
                  {(organizationsQuery.data ?? []).map((organization) => (
                    <option key={organization.id} value={organization.id}>{organization.name}</option>
                  ))}
                </Select>
                {errors.organizacion ? <p className="mt-1 text-xs text-destructive">{errors.organizacion}</p> : null}
              </Field>
            ) : null}

            {resolvedScope.resolved ? (
              <Field label="Scope">
                <div className="flex h-12 items-center rounded-2xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                  {resolvedScope.branchCode || 'Sucursal'} — {resolvedScope.branchName || ''}
                </div>
              </Field>
            ) : resolvedScope.organizationId && resolvedScope.branchId === null ? (
              <Field label="Sucursal">
                <Select className={errors.sucursal ? 'border-destructive ring-1 ring-destructive' : ''} value={String(form.branchId)} onChange={(event) => setForm((current) => ({ ...current, branchId: event.target.value }))}>
                  <option value="">Seleccionar</option>
                  {(branchesQuery.data ?? []).map((branch) => (
                    <option key={branch.id} value={branch.id}>{branch.code} - {branch.name}</option>
                  ))}
                </Select>
                {errors.sucursal ? <p className="mt-1 text-xs text-destructive">{errors.sucursal}</p> : null}
              </Field>
            ) : null}

            <Field label="Referenciado">
              <Select value={form.referenced} onChange={(event) => setForm((current) => ({ ...current, referenced: event.target.value }))}>
                <option value="NO">No</option>
                <option value="SI">Si</option>
              </Select>
            </Field>
          </div>

          {form.referenced === 'SI' ? (
            <div className="mt-4">
              <Field label="Referenciador">
                {selectedReferenciadorId ? (
                  <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm dark:border-emerald-800 dark:bg-emerald-950">
                    <span className="font-medium text-emerald-800 dark:text-emerald-200">{selectedReferenciadorQuery.data?.displayName || `#${selectedReferenciadorId}`}</span>
                    <button type="button" className="ml-auto text-xs text-muted-foreground hover:text-destructive" onClick={() => { setSelectedReferenciadorId(null); setSelectedReferenciador(null); setReferenciadorSearch(''); }}>✕</button>
                  </div>
                ) : (
                  <div className="relative">
                    <Input value={referenciadorSearch} onChange={(event) => setReferenciadorSearch(event.target.value)} placeholder="Buscar por nombre..." />
                    {(referenciadorQuery.data ?? []).length > 0 ? (
                      <div className="absolute z-10 mt-1 w-full rounded-2xl border border-border bg-card p-2 shadow-haze">
                        {referenciadorQuery.data.map((referenciador) => (
                           <button key={referenciador.id} type="button" className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-accent" onClick={() => { setSelectedReferenciadorId(referenciador.id); setSelectedReferenciador(referenciador); setReferenciadorSearch(''); }}>
                            <span className="font-medium">{referenciador.displayName}</span>
                            {referenciador.telefono ? <span className="ml-2 text-xs text-muted-foreground">{referenciador.telefono}</span> : null}
                          </button>
                        ))}
                      </div>
                    ) : referenciadorSearch.length >= 2 && !referenciadorQuery.isFetching ? (
                      <p className="mt-1 text-xs text-muted-foreground">Sin resultados. Escribí el nombre completo para crear uno nuevo.</p>
                    ) : null}
                  </div>
                )}
                {errors.referenciador ? <p className="mt-1 text-xs text-destructive">{errors.referenciador}</p> : null}
              </Field>
            </div>
          ) : null}
        </Card>

        <div className="space-y-5">
          <Card className="border-white/50 bg-card/90 p-6 shadow-haze">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-2xl font-semibold tracking-tight">Cliente</h3>
                <p className="mt-1 text-sm text-muted-foreground">Buscá uno existente o creá uno nuevo.</p>
              </div>
              <Badge variant="outline">Paso 2</Badge>
            </div>

            {!selectedPersonId ? (
              <>
                <div className="mb-4 rounded-2xl border border-border/60 bg-background/70 p-3">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nombre, apellido o documento..."
                      value={personSearch}
                      onChange={(event) => setPersonSearch(event.target.value)}
                    />
                  </div>
                  {(personSearchQuery.data ?? []).length > 0 ? (
                    <div className="mt-2 space-y-1">
                      {personSearchQuery.data.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className="w-full rounded-xl border border-border/50 px-4 py-2.5 text-left text-sm transition hover:bg-primary/10"
                          onClick={() => {
                            setSelectedPersonId(p.id);
                            setForm((current) => ({
                              ...current,
                              person: {
                                nombre: p.nombre || '',
                                apellido: p.apellido || '',
                                telefonoPrincipal: p.telefonoPrincipal || '',
                                emailPrincipal: p.emailPrincipal || '',
                                numeroDocumento: p.numeroDocumento || '',
                              },
                            }));
                            setPersonSearch('');
                          }}
                        >
                          <span className="font-medium">{p.nombreMostrar}</span>
                          {p.numeroDocumento ? <span className="ml-2 text-xs text-muted-foreground">{p.tipoDocumentoCodigo} {p.numeroDocumento}</span> : null}
                        </button>
                      ))}
                    </div>
                  ) : personSearch.length >= 2 && !personSearchQuery.isFetching ? (
                    <p className="mt-2 text-xs text-muted-foreground">No se encontraron personas. Completá los datos abajo para crear una nueva.</p>
                  ) : null}
                </div>

                <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 p-4 text-sm text-muted-foreground">
                  <UserPlus className="mb-2 h-4 w-4" />
                  Completá los datos para crear un nuevo cliente.
                </div>
              </>
            ) : (
              <div className="mb-4 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm dark:bg-emerald-950">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-emerald-800 dark:text-emerald-200">✓ Cliente existente seleccionado</span>
                  <Button size="sm" variant="secondary" onClick={() => { setSelectedPersonId(null); setSelectedVehicleId(null); setForm((current) => ({ ...current, person: { nombre: '', apellido: '', telefonoPrincipal: '', emailPrincipal: '', numeroDocumento: '' } })); }}>
                    Cambiar
                  </Button>
                </div>
              </div>
            )}

            <div className={`grid gap-4 md:grid-cols-2 ${selectedPersonId ? 'opacity-50 pointer-events-none' : ''}`}>
              <Field label="Nombre">
                <Input className={errors.personNombre ? 'border-destructive ring-1 ring-destructive' : ''} value={form.person.nombre} onChange={(event) => updateNested(setForm, 'person', 'nombre', event.target.value)} />
                {errors.personNombre ? <p className="mt-1 text-xs text-destructive">{errors.personNombre}</p> : null}
              </Field>
              <Field label="Apellido">
                <Input className={errors.personApellido ? 'border-destructive ring-1 ring-destructive' : ''} value={form.person.apellido} onChange={(event) => updateNested(setForm, 'person', 'apellido', event.target.value)} />
                {errors.personApellido ? <p className="mt-1 text-xs text-destructive">{errors.personApellido}</p> : null}
              </Field>
              <Field label="Telefono">
                <Input value={form.person.telefonoPrincipal} onChange={(event) => updateNested(setForm, 'person', 'telefonoPrincipal', event.target.value)} />
              </Field>
              <Field label="Email">
                <Input type="email" value={form.person.emailPrincipal} onChange={(event) => updateNested(setForm, 'person', 'emailPrincipal', event.target.value)} />
              </Field>
              <Field label="Documento">
                <Input value={form.person.numeroDocumento} onChange={(event) => updateNested(setForm, 'person', 'numeroDocumento', event.target.value)} />
              </Field>
            </div>
          </Card>

          <Card className="border-white/50 bg-card/90 p-6 shadow-haze">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-2xl font-semibold tracking-tight">Vehículo</h3>
                <p className="mt-1 text-sm text-muted-foreground">Buscá uno existente o cargá uno nuevo.</p>
              </div>
              <Badge variant="outline">Paso 3</Badge>
            </div>

            {!selectedVehicleId ? (
              <>
                {selectedPersonId ? (
                  <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 dark:bg-amber-950">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700 dark:text-amber-300">Vehículos del cliente en otras carpetas</p>
                    {(linkedVehiclesQuery.data ?? []).length > 0 ? (
                      <div className="mt-3 space-y-1">
                        {linkedVehiclesQuery.data.map((v) => (
                          <button
                            key={v.id}
                            type="button"
                            className="w-full rounded-xl border border-amber-300 bg-white px-4 py-2.5 text-left text-sm transition hover:bg-primary/10 dark:bg-slate-900 dark:border-amber-800"
                            onClick={() => {
                              setSelectedVehicleId(v.id);
                              setForm((current) => ({
                                ...current,
                                vehicle: {
                                  ...current.vehicle,
                                  brandText: v.brandText || '',
                                  modelText: v.modelText || '',
                                  plate: v.plate || '',
                                  year: v.year ? String(v.year) : '',
                                  vehicleTypeCode: v.vehicleTypeCode || 'SEDAN',
                                  usageCode: v.usageCode || 'PARTICULAR',
                                  transmissionCode: v.transmissionCode || 'MANUAL',
                                  color: v.color || '',
                                },
                              }));
                            }}
                          >
                            <span className="font-medium">{v.brandText} {v.modelText}</span>
                            <span className="ml-2 text-xs text-muted-foreground">{v.plate}{v.year ? ` (${v.year})` : ''}</span>
                          </button>
                        ))}
                      </div>
                    ) : linkedVehiclesQuery.isFetching ? (
                      <p className="mt-2 text-xs text-amber-600">Buscando vehículos asociados...</p>
                    ) : (
                      <p className="mt-2 text-xs text-amber-600">Este cliente no tiene vehículos en otras carpetas. Buscá por dominio abajo.</p>
                    )}
                  </div>
                ) : (
                  <div className="mb-4 rounded-2xl border border-border/40 bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
                    Primero seleccioná un cliente para ver sus vehículos registrados.
                  </div>
                )}

                <div className="mb-4 rounded-2xl border border-border/60 bg-background/70 p-3">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por dominio o marca/modelo..."
                      value={vehicleSearch}
                      onChange={(event) => setVehicleSearch(event.target.value)}
                    />
                  </div>
                  {(vehicleSearchQuery.data ?? []).length > 0 ? (
                    <div className="mt-2 space-y-1">
                      {vehicleSearchQuery.data.map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          className="w-full rounded-xl border border-border/50 px-4 py-2.5 text-left text-sm transition hover:bg-primary/10"
                          onClick={() => {
                            setSelectedVehicleId(v.id);
                            setForm((current) => ({
                              ...current,
                              vehicle: {
                                ...current.vehicle,
                                brandText: v.brandText || '',
                                modelText: v.modelText || '',
                                plate: v.plate || '',
                                year: v.year ? String(v.year) : '',
                                vehicleTypeCode: v.vehicleTypeCode || 'SEDAN',
                                usageCode: v.usageCode || 'PARTICULAR',
                                transmissionCode: v.transmissionCode || 'MANUAL',
                                color: v.color || '',
                              },
                            }));
                            setVehicleSearch('');
                          }}
                        >
                          <span className="font-medium">{v.brandText} {v.modelText}</span>
                          <span className="ml-2 text-xs text-muted-foreground">{v.plate}{v.year ? ` (${v.year})` : ''}</span>
                        </button>
                      ))}
                    </div>
                  ) : vehicleSearch.length >= 2 && !vehicleSearchQuery.isFetching ? (
                    <p className="mt-2 text-xs text-muted-foreground">No se encontraron vehículos. Completá los datos abajo para cargar uno nuevo.</p>
                  ) : null}
                </div>

                <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 p-4 text-sm text-muted-foreground">
                  <Car className="mb-2 h-4 w-4" />
                  Completá los datos para cargar un nuevo vehículo.
                </div>
              </>
            ) : (
              <div className="mb-4 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm dark:bg-emerald-950">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-emerald-800 dark:text-emerald-200">✓ Vehículo existente seleccionado</span>
                  <Button size="sm" variant="secondary" onClick={() => { setSelectedVehicleId(null); }}>
                    Cambiar
                  </Button>
                </div>
              </div>
            )}

            <div className={`grid gap-4 md:grid-cols-2 ${selectedVehicleId ? 'opacity-50 pointer-events-none' : ''}`}>
              <Field label="Marca">
                <Input list="vehicle-brand-options" className={errors.vehicleMarca ? 'border-destructive ring-1 ring-destructive' : ''} value={form.vehicle.brandText} onChange={(event) => updateNested(setForm, 'vehicle', 'brandText', event.target.value)} />
                <datalist id="vehicle-brand-options">
                  {brandOptions.map((option) => <option key={option.id} value={option.nombre} />)}
                </datalist>
                {errors.vehicleMarca ? <p className="mt-1 text-xs text-destructive">{errors.vehicleMarca}</p> : null}
              </Field>
              <Field label="Modelo">
                <Input list="vehicle-model-options" className={errors.vehicleModelo ? 'border-destructive ring-1 ring-destructive' : ''} value={form.vehicle.modelText} onChange={(event) => updateNested(setForm, 'vehicle', 'modelText', event.target.value)} />
                <datalist id="vehicle-model-options">
                  {modelOptions.map((option) => <option key={option.id} value={option.nombre} />)}
                </datalist>
                {errors.vehicleModelo ? <p className="mt-1 text-xs text-destructive">{errors.vehicleModelo}</p> : null}
              </Field>
              <Field label="Dominio">
                <Input className={errors.vehiclePatente ? 'border-destructive ring-1 ring-destructive' : ''} value={form.vehicle.plate} onChange={(event) => updateNested(setForm, 'vehicle', 'plate', event.target.value.toUpperCase())} />
                {errors.vehiclePatente ? <p className="mt-1 text-xs text-destructive">{errors.vehiclePatente}</p> : null}
              </Field>
              <Field label="Año">
                <Input type="number" min="1900" max="2100" value={form.vehicle.year} onChange={(event) => updateNested(setForm, 'vehicle', 'year', event.target.value)} />
              </Field>
                <Field label="Tipo de vehiculo">
                <Select value={form.vehicle.vehicleTypeCode} onChange={(event) => updateNested(setForm, 'vehicle', 'vehicleTypeCode', event.target.value)}>
                  {vehicleTypeOptions.map((option) => <option key={option.code} value={option.code}>{option.name}</option>)}
                </Select>
              </Field>
              <Field label="Caja">
                <Select value={form.vehicle.transmissionCode} onChange={(event) => updateNested(setForm, 'vehicle', 'transmissionCode', event.target.value)}>
                  {transmissionOptions.map((option) => <option key={option.code} value={option.code}>{option.name}</option>)}
                </Select>
              </Field>
              <Field label="Uso">
                <Select value={form.vehicle.usageCode} onChange={(event) => updateNested(setForm, 'vehicle', 'usageCode', event.target.value)}>
                  {usageOptions.map((option) => <option key={option.code} value={option.code}>{option.name}</option>)}
                </Select>
              </Field>
              <Field label="Color">
                <Input value={form.vehicle.color} onChange={(event) => updateNested(setForm, 'vehicle', 'color', event.target.value)} />
              </Field>
            </div>

            <div className="mt-4">
              <Field label="Observaciones del vehículo">
                <Textarea rows={3} value={form.vehicle.observaciones} onChange={(event) => updateNested(setForm, 'vehicle', 'observaciones', event.target.value)} />
              </Field>
            </div>
          </Card>
        </div>

        <div className="flex flex-col items-center justify-center gap-4 py-6">
          <Button
            disabled={createCaseMutation.isPending || blockingReasons.length > 0}
            size="lg"
            type="submit"
            className="w-full max-w-2xl rounded-[28px] px-10 py-6 text-xl font-semibold shadow-haze transition hover:scale-[1.02]"
          >
            <FolderPlus className="mr-3 h-6 w-6" />
            Crear carpeta {caseTypeName}
          </Button>
          {blockingReasons.length > 0 ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
              <p className="font-semibold">Completá estos datos para habilitar el botón:</p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                {blockingReasons.map((reason) => <li key={reason}>{reason}</li>)}
              </ul>
            </div>
          ) : null}
        </div>
      </form>

      <Dialog
        open={Boolean(createdCase)}
        onClose={() => {
          setCreatedCase(null);
          navigate('/panel');
        }}
        title="Carpeta creada"
        description={`La carpeta ${createdCase?.folderCode} quedó lista para trabajar.`}
      >
        <div className="space-y-5">
          <div className="grid gap-3 rounded-2xl border border-border/60 bg-background/80 p-4 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Carpeta</span><span className="font-semibold">{createdCase?.folderCode}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Tipo</span><span>{createdCase?.caseTypeCode}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Creada por</span><span>{createdCase?.createdByDisplayName}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Estado trámite</span><Badge variant="secondary">{createdCase?.visibleTramiteState?.label}</Badge></div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setCreatedCase(null);
                navigate('/panel');
              }}
            >
              Seguir en el panel
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                navigate(`/cases/${createdCase.id}`);
              }}
            >
              <FolderOpen className="mr-2 h-4 w-4" />
              Ir a la carpeta
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

const updateNested = (setForm, section, key, value) => {
  setForm((current) => ({
    ...current,
    [section]: {
      ...current[section],
      [key]: value,
    },
  }));
};

const Field = ({ label, children }) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    {children}
  </div>
);

const Select = ({ className, children, ...props }) => (
  <select className={`flex h-12 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 ${className || ''}`} {...props}>
    {children}
  </select>
);
