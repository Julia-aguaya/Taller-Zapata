import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, FolderOpen, ReceiptText, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { requestJson } from '@/shared/api/http-client';
import { getCasePersons, getThirdParty, getThirdPartyWorkshop, saveThirdPartyWorkshop } from '@/modules/cases/api/third-party-api';
import { listCases } from '@/modules/cases/api/cases-api';
import { listInsuranceCompanies, listInsuranceCompanyContacts } from '@/modules/cases/api/new-case-api';
import { ThirdPartyWorkshopIncidentSection } from '@/modules/cases/components/third-party-workshop-editor';
import { DocumentsSection } from '@/modules/cases/components/documents-section';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

const selectClass = 'h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20';

const Field = ({ label, children }) => (
  <div className="min-w-0">
    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</label>
    {children}
  </div>
);
const emptyInsuranceContact = { personId: '', creating: false, name: '', lastName: '', email: '', phone: '', person: null };
const contactForm = (contact) => contact ? { personId: String(contact.personId ?? ''), creating: false, name: contact.name ?? '', lastName: '', email: contact.email ?? '', phone: contact.phone ?? '', person: null } : emptyInsuranceContact;
const InsuranceContactField = ({ label, companyId, roleCode, value, onChange }) => {
  const contactsQuery = useQuery({ queryKey: ['insurance', 'companies', companyId, 'contacts'], queryFn: () => listInsuranceCompanyContacts(companyId), enabled: Boolean(companyId) });
  const personQuery = useQuery({ queryKey: ['persons', value.personId], queryFn: () => requestJson(`/persons/${value.personId}`), enabled: Boolean(value.personId) });
  const contacts = (contactsQuery.data ?? []).filter((contact) => contact.contactRoleCode === roleCode);
  useEffect(() => { if (personQuery.data && !value.creating) onChange((current) => ({ ...current, name: personQuery.data.nombre ?? '', lastName: personQuery.data.apellido ?? '', email: personQuery.data.emailPrincipal ?? '', phone: personQuery.data.telefonoPrincipal ?? '', person: personQuery.data })); }, [personQuery.data, value.creating, value.personId]);
  if (!companyId) return <Field label={label}><p className="py-2 text-sm font-normal normal-case text-muted-foreground">Seleccioná la compañía del tercero para elegir un contacto.</p></Field>;
  return <Field label={label}><select aria-label={label} value={value.creating ? '__new' : value.personId} onChange={(event) => onChange(event.target.value === '__new' ? { ...emptyInsuranceContact, creating: true } : { ...emptyInsuranceContact, personId: event.target.value })} className={selectClass}><option value="">Seleccionar...</option>{contacts.map((contact) => <option key={contact.id} value={contact.personId}>{contact.personName}</option>)}<option value="__new">Crear contacto...</option></select>{value.creating || value.personId ? <div className="mt-2 grid gap-2 md:grid-cols-2"><Input aria-label={`Nombre ${label}`} value={value.name} onChange={(event) => onChange((current) => ({ ...current, name: event.target.value }))} placeholder="Nombre" /><Input aria-label={`Apellido ${label}`} value={value.lastName} onChange={(event) => onChange((current) => ({ ...current, lastName: event.target.value }))} placeholder="Apellido" /><Input aria-label={`Correo ${label}`} type="email" value={value.email} onChange={(event) => onChange((current) => ({ ...current, email: event.target.value }))} placeholder="correo@compania.com" /><Input aria-label={`Teléfono ${label}`} value={value.phone} onChange={(event) => onChange((current) => ({ ...current, phone: event.target.value }))} placeholder="Teléfono" /></div> : null}</Field>;
};

const RecoveryInsuranceDataSection = ({ caseId, associatedFolderCode }) => {
  const queryClient = useQueryClient();
  const insuranceQuery = useQuery({ queryKey: ['cases', String(caseId), 'insurance'], queryFn: () => requestJson(`/cases/${caseId}/insurance`) });
  const workshopQuery = useQuery({ queryKey: ['cases', String(caseId), 'third-party-workshop'], queryFn: () => getThirdPartyWorkshop(caseId) });
  const companiesQuery = useQuery({ queryKey: ['insurance', 'companies'], queryFn: listInsuranceCompanies });
  const [insurance, setInsurance] = useState({ companyId: '', claimNumber: '' });
  const [thirdParty, setThirdParty] = useState({ companyId: '', claimReference: '', processor: emptyInsuranceContact, inspector: emptyInsuranceContact });
  useEffect(() => { setInsurance({ companyId: String(insuranceQuery.data?.insuranceCompanyId ?? ''), claimNumber: insuranceQuery.data?.claimNumber ?? '' }); }, [insuranceQuery.data]);
  useEffect(() => { const data = workshopQuery.data; if (data) setThirdParty({ companyId: String(data.thirdPartyCompanyId ?? ''), claimReference: data.claimReference ?? '', processor: contactForm(data.processor), inspector: contactForm(data.inspector) }); }, [workshopQuery.data]);
  const saveMutation = useMutation({ mutationFn: async () => {
    if (!insurance.companyId) throw new Error('Seleccioná la compañía aseguradora.');
    await requestJson(`/cases/${caseId}/insurance`, { method: 'PUT', body: JSON.stringify({ insuranceCompanyId: Number(insurance.companyId), policyNumber: insuranceQuery.data?.policyNumber ?? null, certificateNumber: insuranceQuery.data?.certificateNumber ?? null, coverageDetail: insuranceQuery.data?.coverageDetail ?? null, claimNumber: insurance.claimNumber || null, processorPersonId: insuranceQuery.data?.processorPersonId ?? null, inspectorPersonId: insuranceQuery.data?.inspectorPersonId ?? null }) });
    return saveThirdPartyWorkshop(caseId, { thirdPartyCompanyId: thirdParty.companyId ? Number(thirdParty.companyId) : null, claimReference: thirdParty.claimReference || null, thirdPartyVehicleId: workshopQuery.data?.thirdPartyVehicleId ?? null, driverPersonId: workshopQuery.data?.driverPersonId ?? null, processorPersonId: thirdParty.processor.personId ? Number(thirdParty.processor.personId) : null, newProcessor: thirdParty.processor.creating && thirdParty.processor.name.trim() ? { name: thirdParty.processor.name.trim(), lastName: thirdParty.processor.lastName.trim() || null, email: thirdParty.processor.email || null, phone: thirdParty.processor.phone || null } : null, inspectorPersonId: thirdParty.inspector.personId ? Number(thirdParty.inspector.personId) : null, newInspector: thirdParty.inspector.creating && thirdParty.inspector.name.trim() ? { name: thirdParty.inspector.name.trim(), lastName: thirdParty.inspector.lastName.trim() || null, email: thirdParty.inspector.email || null, phone: thirdParty.inspector.phone || null } : null });
  }, onSuccess: async (saved) => { queryClient.setQueryData(['cases', String(caseId), 'third-party-workshop'], saved); await Promise.all([queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'insurance'] }), queryClient.invalidateQueries({ queryKey: ['insurance', 'companies', thirdParty.companyId, 'contacts'] })]); toast.success('Datos del seguro guardados.'); }, onError: (error) => toast.error(error.message) });
  return <section className="rounded-2xl border border-border/70 p-4" aria-label="Datos del seguro"><div className="flex items-center justify-between gap-3"><div><h5 className="text-sm font-semibold">Datos del seguro</h5>{associatedFolderCode ? <p className="text-xs text-muted-foreground">Datos traídos de la carpeta asociada {associatedFolderCode}; podés editarlos localmente.</p> : <p className="text-xs text-muted-foreground">Compañías, referencias y contactos reutilizables.</p>}</div><Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}><Save className="mr-1.5 h-3.5 w-3.5" />Guardar</Button></div><div className="mt-4 grid gap-3 md:grid-cols-2"><Field label="Cía. aseguradora"><select aria-label="Cía. aseguradora" value={insurance.companyId} onChange={(event) => setInsurance((current) => ({ ...current, companyId: event.target.value }))} className={selectClass}><option value="">Seleccionar...</option>{(companiesQuery.data ?? []).map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></Field><Field label="Cía. del tercero"><select aria-label="Cía. del tercero" value={thirdParty.companyId} onChange={(event) => setThirdParty((current) => ({ ...current, companyId: event.target.value, processor: emptyInsuranceContact, inspector: emptyInsuranceContact }))} className={selectClass}><option value="">Seleccionar...</option>{(companiesQuery.data ?? []).map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></Field><Field label="N.º de siniestro"><Input aria-label="N.º de siniestro" value={insurance.claimNumber} onChange={(event) => setInsurance((current) => ({ ...current, claimNumber: event.target.value }))} /></Field><Field label="N.º de reclamo / referencia"><Input aria-label="N.º de reclamo / referencia" value={thirdParty.claimReference} onChange={(event) => setThirdParty((current) => ({ ...current, claimReference: event.target.value }))} /></Field><InsuranceContactField label="Tramitador/a" companyId={thirdParty.companyId} roleCode="TRAMITADOR" value={thirdParty.processor} onChange={(update) => setThirdParty((current) => ({ ...current, processor: typeof update === 'function' ? update(current.processor) : update }))} /><InsuranceContactField label="Inspector/a" companyId={thirdParty.companyId} roleCode="INSPECTOR" value={thirdParty.inspector} onChange={(update) => setThirdParty((current) => ({ ...current, inspector: typeof update === 'function' ? update(current.inspector) : update }))} /></div></section>;
};

const toAmount = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };

export const FranchiseRecoveryEditor = ({ caseId, caseDetail, onSaved }) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const recoveryQuery = useQuery({ queryKey: ['cases', String(caseId), 'franchise-recovery'], queryFn: () => requestJson(`/cases/${caseId}/franchise-recovery`) });
  const catalogsQuery = useQuery({ queryKey: ['recovery', 'catalogs'], queryFn: () => requestJson('/recovery/catalogs') });
  const todoRiesgoCasesQuery = useQuery({ queryKey: ['recovery', 'todo-riesgo-cases'], queryFn: () => listCases({ caseTypeCode: 'TODO_RIESGO', size: 100 }) });

  const recovery = recoveryQuery.data;
  const baseCaseId = recovery?.baseCaseId;
  const baseInsuranceQuery = useQuery({ queryKey: ['cases', String(baseCaseId), 'insurance'], queryFn: () => requestJson(`/cases/${baseCaseId}/insurance`), enabled: Boolean(baseCaseId) });
  const baseIncidentQuery = useQuery({ queryKey: ['cases', String(baseCaseId), 'incident'], queryFn: () => requestJson(`/cases/${baseCaseId}/incident`), enabled: Boolean(baseCaseId) });
  const baseThirdPartyQuery = useQuery({ queryKey: ['cases', String(baseCaseId), 'third-party'], queryFn: () => getThirdParty(baseCaseId), enabled: Boolean(baseCaseId) });
  const basePeopleQuery = useQuery({ queryKey: ['cases', String(baseCaseId), 'persons'], queryFn: () => getCasePersons(baseCaseId), enabled: Boolean(baseCaseId) });
  const managerCodes = (catalogsQuery.data?.managerCodes ?? []).filter(({ code }) => ['TALLER', 'ABOGADO'].includes(code));
  const opinionCodes = catalogsQuery.data?.opinionCodes ?? [];
  const paymentStatusCodes = catalogsQuery.data?.paymentStatusCodes ?? [];
  const baseInsurance = baseInsuranceQuery.data;
  const baseIncident = baseIncidentQuery.data;
  const baseThirdParty = baseThirdPartyQuery.data;
  const basePeople = Array.isArray(basePeopleQuery.data) ? basePeopleQuery.data : [];
  const personName = (personId) => basePeople.find((person) => String(person.personId ?? person.id) === String(personId))?.personDisplayName ?? basePeople.find((person) => String(person.personId ?? person.id) === String(personId))?.displayName ?? 'Sin informar';

  const mutation = useMutation({
    mutationFn: (payload) => requestJson(`/cases/${caseId}/franchise-recovery`, { method: 'PUT', body: JSON.stringify(payload) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'franchise-recovery'] });
      queryClient.invalidateQueries({ queryKey: ['cases', String(caseId), 'workspace'] });
      toast.success('Recupero guardado.');
      onSaved?.();
    },
    onError: (e) => toast.error(e.message),
  });

  const [enablesRepair, setEnablesRepair] = useState(recovery?.enablesRepair ? 'SI' : 'NO');
  const [recoversClient, setRecoversClient] = useState(recovery?.recoversClient ? 'SI' : 'NO');
  const [dictamen, setDictamen] = useState(recovery?.opinionCode ?? '');
  const [agreedAmount, setAgreedAmount] = useState(recovery?.agreedAmount ?? '');
  const [recoveryAmount, setRecoveryAmount] = useState(recovery?.recoveryAmount ?? '');
  const [clientAmount, setClientAmount] = useState(recovery?.clientAmount ?? '');
  const [incidentDate, setIncidentDate] = useState(recovery?.incidentDate ?? '');
  const [presentedAt, setPresentedAt] = useState(recovery?.presentedAt ?? '');
  const [selectedBaseCaseId, setSelectedBaseCaseId] = useState(recovery?.baseCaseId ? String(recovery.baseCaseId) : '');

  useEffect(() => {
    setEnablesRepair(recovery?.enablesRepair ? 'SI' : 'NO');
    setRecoversClient(recovery?.recoversClient ? 'SI' : 'NO');
    setDictamen(recovery?.opinionCode ?? '');
    setAgreedAmount(recovery?.agreedAmount ?? '');
    setRecoveryAmount(recovery?.recoveryAmount ?? '');
    setClientAmount(recovery?.clientAmount ?? '');
    setIncidentDate(recovery?.incidentDate ?? '');
    setPresentedAt(recovery?.presentedAt ?? '');
    setSelectedBaseCaseId(recovery?.baseCaseId ? String(recovery.baseCaseId) : '');
  }, [recovery]);

  const agreed = toAmount(agreedAmount);
  const toRecover = toAmount(recoveryAmount);
  const culpaCompartida = dictamen === 'CULPA_COMPARTIDA';
  const clientShare = culpaCompartida ? toRecover / 2 : null;
  const showLowerAgreementWarning = agreed > 0 && toRecover > 0 && toRecover < agreed && !culpaCompartida;

  const handleSave = () => {
    const form = document.getElementById('franchise-recovery-form');
    const fd = new FormData(form);
    const habilitado = fd.get('enablesRepair') === 'SI';
    const recuperaCliente = culpaCompartida || (!habilitado && fd.get('recoversClient') === 'SI');

    mutation.mutate({
      managerCode: fd.get('managerCode') || null,
      baseCaseId: recovery?.baseCaseId ?? (selectedBaseCaseId ? Number(selectedBaseCaseId) : null),
      baseFolderCode: recovery?.baseFolderCode ?? null,
      incidentDate: incidentDate || null,
      presentedAt: presentedAt || null,
      opinionCode: fd.get('opinionCode') || null,
      agreedAmount: toAmount(fd.get('agreedAmount')) || null,
      recoveryAmount: toAmount(fd.get('recoveryAmount')) || null,
      enablesRepair: habilitado,
      recoversClient: recuperaCliente,
      clientAmount: recuperaCliente ? (toAmount(clientAmount) || null) : null,
      clientPaymentStatusCode: recuperaCliente ? (fd.get('clientPaymentStatusCode') || null) : null,
      clientPaymentDate: recuperaCliente ? (fd.get('clientPaymentDate') || null) : null,
      inspectionForwardedAt: fd.get('inspectionForwardedAt') || null,
      inspectionDate: fd.get('inspectionDate') || null,
      modalityCode: fd.get('modalityCode') || null,
      quotationStatusCode: fd.get('quotationStatusCode') || null,
      quotationDate: fd.get('quotationDate') || null,
      includesParts: fd.get('includesParts') === 'SI',
      repairsVehicle: fd.get('repairsVehicle') === 'SI',
      partsProvisionModeCode: fd.get('partsProvisionModeCode') || null,
      approvedLowerAgreement: false,
      approvalNote: null,
      reusesBaseData: true,
    });
  };

  return (
    <div className="rounded-3xl border border-border/70 bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ReceiptText className="h-5 w-5" />
          </div>
          <h4 className="text-sm font-semibold">Recupero de franquicia</h4>
        </div>
        <Button size="sm" onClick={handleSave} disabled={mutation.isPending}><Save className="mr-1.5 h-3.5 w-3.5" />Guardar</Button>
      </div>

      {recovery?.baseCaseId && recovery?.baseFolderCode ? (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-border/60 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          <FolderOpen className="h-3.5 w-3.5 shrink-0" />
          <span>Recupero de la carpeta {recovery.baseFolderCode}</span>
          <Button type="button" size="sm" variant="outline" className="ml-auto" aria-label={`Abrir carpeta asociada ${recovery.baseFolderCode}`} onClick={() => navigate(`/cases/${recovery.baseCaseId}`)}>
            Abrir carpeta
          </Button>
        </div>
      ) : (
        <p className="mt-3 rounded-xl border border-dashed border-border/60 px-3 py-2 text-xs text-muted-foreground">Sin carpeta asociada.</p>
      )}

      {recovery?.baseCaseId ? <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs" aria-label="Datos provenientes de la carpeta asociada">
        <p className="font-semibold text-primary">Datos provenientes de la carpeta asociada</p>
        <p className="mt-1 text-muted-foreground">Esta información se consulta desde Todo Riesgo y no se edita desde Recupero.</p>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          <span><b>Cía. propia:</b> {baseInsurance?.insuranceCompanyId ?? 'Sin informar'}</span>
          <span><b>Cía. tercero:</b> {baseThirdParty?.thirdPartyCompanyId ?? baseInsurance?.thirdPartyCompanyId ?? 'Sin informar'}</span>
          <span><b>N.º siniestro:</b> {baseInsurance?.claimNumber ?? 'Sin informar'}</span>
          <span><b>Referencia tercero:</b> {baseThirdParty?.claimReference ?? 'Sin informar'}</span>
          <span><b>Tramitador:</b> {personName(baseInsurance?.processorPersonId)}</span>
          <span><b>Inspector:</b> {personName(baseInsurance?.inspectorPersonId)}</span>
          <span><b>Siniestro:</b> {baseIncident?.incidentDate ?? 'Sin fecha'} · {baseIncident?.incidentPlace ?? 'Sin lugar'}</span>
          <span className="md:col-span-2"><b>Dinámica:</b> {baseIncident?.incidentDynamics ?? 'Sin informar'}</span>
          <span className="md:col-span-3"><b>Terceros involucrados:</b> {basePeople.filter((person) => !person.principal && !['TRAMITADOR', 'INSPECTOR'].includes(person.caseRoleCode)).map((person) => person.personDisplayName ?? person.displayName ?? person.personId).join(', ') || 'Sin informar'}</span>
        </div>
      </div> : null}

      <form id="franchise-recovery-form" key={recovery?.id ?? 'new'} className="mt-4 space-y-3">
        <section className="rounded-2xl border border-border/70 p-4" aria-label="Datos generales">
          <h5 className="text-sm font-semibold">Datos generales</h5>
          <p className="mt-1 text-xs text-muted-foreground">La prescripción y los días tramitando los calcula el sistema.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <Field label="Fecha del siniestro"><Input aria-label="Fecha del siniestro" type="date" value={incidentDate} onChange={(event) => setIncidentDate(event.target.value)} /></Field>
            <Field label="Fecha presentado"><Input aria-label="Fecha presentado" type="date" value={presentedAt} onChange={(event) => setPresentedAt(event.target.value)} /></Field>
            <Field label="Prescripción del trámite"><Input aria-label="Prescripción del trámite" readOnly value={recovery?.prescriptionDate ?? (presentedAt ? 'Se calculará al guardar' : 'Ingresá Fecha presentado')} /></Field>
            <Field label="Días tramitando"><Input aria-label="Días tramitando" readOnly value={recovery?.daysInProcess ?? (presentedAt ? 'Se calculará al guardar' : 'Ingresá Fecha presentado')} /></Field>
            <Field label="Carpeta asociada">
              {recovery?.baseCaseId ? <Input aria-label="Carpeta asociada" readOnly value={`${recovery.baseFolderCode} · ${recovery.baseFolderName ?? 'Todo Riesgo'}`} /> : <select aria-label="Carpeta asociada" value={selectedBaseCaseId} onChange={(event) => setSelectedBaseCaseId(event.target.value)} className={selectClass}><option value="">Sin carpeta asociada</option>{(todoRiesgoCasesQuery.data?.content ?? []).map((item) => <option key={item.id} value={item.id}>{item.folderCode} · {item.principalCustomerName ?? 'Todo Riesgo'}</option>)}</select>}
            </Field>
            <Field label="Dictamen"><select aria-label="Dictamen" name="opinionCode" value={dictamen} onChange={(e) => setDictamen(e.target.value)} className={selectClass}><option value="">—</option>{opinionCodes.map((o) => (<option key={o.code} value={o.code}>{o.name || o.code}</option>))}</select></Field>
            <Field label="Gestiona"><select aria-label="Gestiona" name="managerCode" defaultValue={recovery?.managerCode ?? ''} className={selectClass}><option value="">—</option>{managerCodes.map((m) => (<option key={m.code} value={m.code}>{m.name || m.code}</option>))}</select></Field>
          </div>
        </section>
        <RecoveryInsuranceDataSection caseId={caseId} associatedFolderCode={recovery?.baseFolderCode} />
        <ThirdPartyWorkshopIncidentSection caseId={caseId} />
        <DocumentsSection caseId={caseId} moduleCode="GESTION_TRAMITE" originCode="GESTION_TRAMITE" includeHistorical={false} title="Documentación" showCompleteAction showAllCategories editableMetadata />
        <section className="rounded-2xl border border-border/70 p-4" aria-label="Tramitación"><h5 className="text-sm font-semibold">Tramitación</h5><p className="mt-1 text-xs text-muted-foreground">Fecha presentado y Dictamen se administran en Datos generales.</p><div className="mt-4 grid gap-3 md:grid-cols-3"><Field label="Monto a recuperar"><Input aria-label="Monto a recuperar" readOnly value={recoveryAmount} /></Field><Field label="Habilita reparación"><select name="enablesRepair" aria-label="Habilita reparación" value={enablesRepair} onChange={(e) => setEnablesRepair(e.target.value)} className={selectClass}><option value="NO">No</option><option value="SI">Sí</option></select></Field><Field label="Cotización"><select name="quotationStatusCode" aria-label="Cotización" defaultValue={recovery?.quotationStatusCode ?? ''} className={selectClass}><option value="">—</option><option value="PENDIENTE">Pendiente</option><option value="ENVIADA">Enviada</option><option value="ACEPTADA">Aceptada</option><option value="RECHAZADA">Rechazada</option></select></Field><Field label="Fecha cotización"><Input name="quotationDate" aria-label="Fecha cotización" type="date" defaultValue={recovery?.quotationDate ?? ''} /></Field><Field label="Monto acordado"><Input name="agreedAmount" aria-label="Monto acordado" type="number" min="0" step="0.01" value={agreedAmount} onChange={(e) => setAgreedAmount(e.target.value)} /></Field>{enablesRepair === 'SI' ? <><Field label="Derivado a inspección"><Input name="inspectionForwardedAt" aria-label="Derivado a inspección" type="date" defaultValue={recovery?.inspectionForwardedAt ?? ''} /></Field><Field label="Fecha inspección"><Input name="inspectionDate" aria-label="Fecha inspección" type="date" defaultValue={recovery?.inspectionDate ?? ''} /></Field><Field label="Modalidad"><select name="modalityCode" aria-label="Modalidad" defaultValue={recovery?.modalityCode ?? ''} className={selectClass}><option value="">—</option><option value="PRESENCIAL">Presencial</option><option value="FOTOS">Fotos</option><option value="OTRO">Otro</option></select></Field><Field label="Lleva repuestos"><select name="includesParts" aria-label="Lleva repuestos" defaultValue={recovery?.includesParts ? 'SI' : 'NO'} className={selectClass}><option value="NO">No</option><option value="SI">Sí</option></select></Field><Field label="Repara vehículo"><select name="repairsVehicle" aria-label="Repara vehículo" defaultValue={recovery?.repairsVehicle ? 'SI' : 'NO'} className={selectClass}><option value="NO">No</option><option value="SI">Sí</option></select></Field><Field label="Provee repuestos"><select name="partsProvisionModeCode" aria-label="Provee repuestos" defaultValue={recovery?.partsProvisionModeCode ?? ''} className={selectClass}><option value="">—</option><option value="COMPANIA">Compañía</option><option value="TALLER">Taller</option><option value="CLIENTE">Cliente</option></select></Field></> : null}</div></section>
        <div className="grid gap-x-6 gap-y-3 md:grid-cols-3">
          <Field label="Habilita reparación">
            <select name="enablesRepair" value={enablesRepair} onChange={(e) => setEnablesRepair(e.target.value)} className={selectClass}>
              <option value="NO">NO</option>
              <option value="SI">SI</option>
            </select>
          </Field>

          <Field label="Monto acordado">
            <Input name="agreedAmount" type="number" min="0" step="0.01" value={agreedAmount} onChange={(e) => setAgreedAmount(e.target.value)} placeholder="500000" />
          </Field>
          <Field label="Monto a recuperar">
            <Input name="recoveryAmount" type="number" min="0" step="0.01" value={recoveryAmount} onChange={(e) => setRecoveryAmount(e.target.value)} placeholder="500000" />
          </Field>
        </div>

        <div className="grid gap-x-6 gap-y-3 md:grid-cols-2 xl:grid-cols-5">
          <Field label="Mínimo mano de obra"><Input aria-label="Mínimo mano de obra" readOnly value={recovery?.minimumLaborAmount ?? ''} className="cursor-not-allowed bg-muted/50" /></Field>
          <Field label="Mínimo repuestos"><Input aria-label="Mínimo repuestos" readOnly value={recovery?.minimumPartsAmount ?? ''} className="cursor-not-allowed bg-muted/50" /></Field>
          <Field label="Total final repuestos"><Input aria-label="Total final repuestos" readOnly value={recovery?.finalPartsTotal ?? ''} className="cursor-not-allowed bg-muted/50" /></Field>
          <Field label="A facturar Cía."><Input aria-label="A facturar Cía." readOnly value={recovery?.amountToBillCompany ?? ''} className="cursor-not-allowed bg-muted/50" /></Field>
          <Field label="Final a favor Taller"><Input aria-label="Final a favor Taller" readOnly value={recovery?.finalAmountForWorkshop ?? ''} className="cursor-not-allowed bg-muted/50" /></Field>
        </div>

        {enablesRepair !== 'SI' ? <p className="rounded-xl border border-primary/15 bg-primary/5 px-3 py-2 text-xs text-primary">La reparación se gestiona desde la carpeta asociada mientras Habilita reparación permanezca en No. Los datos propios de Recupero se conservan al volver a habilitarla.</p> : null}

        {enablesRepair !== 'SI' || culpaCompartida ? (
          <div className="grid gap-x-6 gap-y-3 md:grid-cols-4">
            <Field label="Recupera a favor del cliente">
              <select name="recoversClient" value={culpaCompartida ? 'SI' : recoversClient} disabled={culpaCompartida} onChange={(e) => { setRecoversClient(e.target.value); if (e.target.value === 'SI' && !culpaCompartida && !clientAmount) setClientAmount(recoveryAmount); }} className={selectClass}>
                <option value="NO">NO</option>
                <option value="SI">SI</option>
              </select>
            </Field>
            {culpaCompartida || recoversClient === 'SI' ? (
              <>
                <Field label={culpaCompartida ? 'Monto a cargo del cliente (50%)' : 'Monto a reintegrar al cliente'}>
                  <Input name="clientAmount" type="number" min="0" step="0.01" value={culpaCompartida ? clientShare : clientAmount} onChange={(event) => setClientAmount(event.target.value)} readOnly={culpaCompartida} placeholder={culpaCompartida ? '50% del recupero' : '0'} />
                </Field>
                <Field label={culpaCompartida ? 'Estado de cobro al cliente' : 'Estado del reintegro'}>
                  <select name="clientPaymentStatusCode" defaultValue={recovery?.clientPaymentStatusCode ?? ''} className={selectClass}>
                    <option value="">—</option>
                    {paymentStatusCodes.map((p) => (<option key={p.code} value={p.code}>{p.name || p.code}</option>))}
                  </select>
                </Field>
                <Field label={culpaCompartida ? 'Fecha de cobro' : 'Fecha de reintegro'}>
                  <Input name="clientPaymentDate" type="date" defaultValue={recovery?.clientPaymentDate ?? ''} />
                </Field>
              </>
            ) : null}
          </div>
        ) : null}

        {showLowerAgreementWarning ? (
          <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            El monto a recuperar es inferior al acordado. Requiere autorización del administrador.
          </div>
        ) : null}

        {recovery?.approvedLowerAgreement ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">Excepción aprobada por administrador.</p> : null}
      </form>
    </div>
  );
};
