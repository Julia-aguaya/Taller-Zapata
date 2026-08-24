import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createProvider } from '@/modules/cases/api/providers-api';
import { Dialog } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

export const ProviderCreateDialog = ({ open, onClose, onCreated }) => {
  const client = useQueryClient();
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [error, setError] = useState('');
  const mutation = useMutation({ mutationFn: () => createProvider(form), onSuccess: async (provider) => { await client.invalidateQueries({ queryKey: ['providers'] }); onCreated?.(provider); setForm({ name: '', phone: '', email: '' }); setError(''); onClose(); }, onError: (cause) => setError(cause.message || 'No se pudo crear el proveedor.') });
  return <Dialog open={open} onClose={onClose} title="Crear proveedor global" description="El proveedor quedará disponible para futuras comparaciones."><form className="space-y-4" onSubmit={(event) => { event.preventDefault(); setError(''); mutation.mutate(); }}><div><Label htmlFor="provider-create-name">Nombre</Label><Input id="provider-create-name" data-dialog-initial-focus value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required /></div><div><Label htmlFor="provider-create-phone">Teléfono</Label><Input id="provider-create-phone" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} /></div><div><Label htmlFor="provider-create-email">Email</Label><Input id="provider-create-email" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} /></div>{error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}<div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onClose}>Cancelar</Button><Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Creando...' : 'Crear proveedor'}</Button></div></form></Dialog>;
};
