import { CatalogShell } from '@/modules/management/components/catalog-shell';
import { providersApi } from '@/modules/management/api/catalogs-api';

const initialForm = (item = {}) => ({ name: item.name || '', phone: item.phone || '', email: item.email || '' });

export const ManagementProvidersPage = () => <CatalogShell title="Proveedores" description="Administrá proveedores para seleccionarlos en repuestos, presupuestos y trámites." singular="Proveedor" queryPrefix={['providers']} api={providersApi} initialForm={initialForm} listLabel={(item) => item.name || 'Sin nombre'} fields={[{ name: 'name', label: 'Nombre', required: true }, { name: 'phone', label: 'Teléfono' }, { name: 'email', label: 'Email', type: 'email' }]} invalidate={[['cases'], ['budgets'], ['insurance-processing']]} />;
