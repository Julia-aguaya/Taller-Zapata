import { CatalogShell } from '@/modules/management/components/catalog-shell';
import { referrersApi } from '@/modules/management/api/catalogs-api';

const initialForm = (item = {}) => ({ nombre: item.nombre || '', apellido: item.apellido || '', telefono: item.telefono || '' });

export const ManagementReferrersPage = () => <CatalogShell title="Referenciadores" description="Administrá las personas que pueden referir clientes al taller." singular="Referenciador" queryPrefix={['referenciadores']} api={referrersApi} initialForm={initialForm} listLabel={(item) => item.displayName || [item.nombre, item.apellido].filter(Boolean).join(' ') || 'Sin nombre'} fields={[{ name: 'nombre', label: 'Nombre', required: true }, { name: 'apellido', label: 'Apellido' }, { name: 'telefono', label: 'Teléfono' }]} invalidate={[['cases']]} />;
