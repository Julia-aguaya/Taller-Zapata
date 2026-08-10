import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { CatalogShell } from '@/modules/management/components/catalog-shell';
import { createInsuranceCompanyContact, deleteInsuranceCompanyContact, insuranceCompaniesApi, listInsuranceCompanyContacts } from '@/modules/management/api/catalogs-api';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

const initialForm = (item = {}) => ({ code: item.code || '', name: item.name || '', taxId: item.taxId || '', requiresRepairPhotos: Boolean(item.requiresRepairPhotos), expectedPaymentDays: item.expectedPaymentDays ?? '' });

export const ManagementInsurancePage = () => <CatalogShell title="Compañías de seguros" description="Consultá, creá y actualizá las aseguradoras disponibles para las carpetas." singular="Compañía" queryPrefix={['insurance', 'companies']} api={insuranceCompaniesApi} initialForm={initialForm} listLabel={(item) => item.name || item.code || 'Sin nombre'} fields={[{ name: 'code', label: 'Código', required: true }, { name: 'name', label: 'Nombre', required: true }, { name: 'taxId', label: 'CUIT' }, { name: 'expectedPaymentDays', label: 'Días de pago esperados', type: 'number' }, { name: 'requiresRepairPhotos', label: 'Requiere fotos de reparación', type: 'checkbox' }]} invalidate={[['cases'], ['insurance']]} renderDetail={(company) => <CompanyContacts companyId={company.id} />} />;

const CompanyContacts = ({ companyId }) => {
  const queryClient = useQueryClient();
  const [personId, setPersonId] = useState('');
  const [role, setRole] = useState('ADMINISTRATIVO');
  const contactsQuery = useQuery({ queryKey: ['insurance', 'companies', companyId, 'contacts'], queryFn: () => listInsuranceCompanyContacts(companyId) });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['insurance', 'companies', companyId, 'contacts'] });
  const createMutation = useMutation({ mutationFn: () => createInsuranceCompanyContact(companyId, { personId: Number(personId), contactRoleCode: role }), onSuccess: async () => { setPersonId(''); await invalidate(); toast.success('Contacto agregado.'); }, onError: (error) => toast.error(error.message || 'No pude agregar el contacto.') });
  const deleteMutation = useMutation({ mutationFn: (contactId) => deleteInsuranceCompanyContact(companyId, contactId), onSuccess: async () => { await invalidate(); toast.success('Contacto eliminado.'); }, onError: (error) => toast.error(error.message || 'No pude eliminar el contacto.') });
  return <section className="rounded-2xl border border-border/60 bg-background/70 p-4"><h4 className="font-semibold">Contactos</h4><div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]"><Input aria-label="ID de persona" type="number" min="1" value={personId} onChange={(event) => setPersonId(event.target.value)} placeholder="ID de persona" /><Input aria-label="Rol del contacto" value={role} onChange={(event) => setRole(event.target.value)} placeholder="Rol" /><Button disabled={!personId || createMutation.isPending} onClick={() => createMutation.mutate()}><Plus className="mr-2 h-4 w-4" />Agregar</Button></div>{contactsQuery.isLoading ? <p className="mt-3 text-sm text-muted-foreground">Cargando contactos...</p> : contactsQuery.isError ? <p className="mt-3 text-sm text-destructive">No pude cargar los contactos.</p> : contactsQuery.data?.length ? <ul className="mt-3 space-y-2">{contactsQuery.data.map((contact) => <li key={contact.id} className="flex items-center justify-between rounded-xl border border-border/60 p-3 text-sm"><span>Persona #{contact.personId} · {contact.contactRoleCode}</span><Button variant="ghost" size="sm" className="text-destructive" aria-label={`Eliminar contacto ${contact.personId}`} disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate(contact.id)}><Trash2 className="h-4 w-4" /></Button></li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">No hay contactos asociados.</p>}</section>;
};
