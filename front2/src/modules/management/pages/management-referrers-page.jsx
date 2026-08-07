import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { searchReferenciadores, createReferenciador } from '@/modules/cases/api/cases-api';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Card } from '@/shared/ui/card';

export const ManagementReferrersPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [newName, setNewName] = useState('');
  const [newSurname, setNewSurname] = useState('');
  const [newPhone, setNewPhone] = useState('');

  const referenciadoresQuery = useQuery({
    queryKey: ['referenciadores', 'search', search],
    queryFn: () => searchReferenciadores(search),
  });

  const createMutation = useMutation({
    mutationFn: () => createReferenciador({ nombre: newName, apellido: newSurname, telefono: newPhone }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['referenciadores'] });
      setNewName(''); setNewSurname(''); setNewPhone('');
      toast.success('Referenciador creado.');
    },
    onError: (e) => toast.error(e.message),
  });

  const handleCreate = () => {
    if (!newName.trim()) { toast.error('El nombre es obligatorio.'); return; }
    createMutation.mutate();
  };

  const referenciadores = referenciadoresQuery.data ?? [];

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Referenciadores</h1>
          <p className="text-sm text-muted-foreground">Personas que refieren clientes al taller.</p>
        </div>
      </div>

      <Card className="p-5">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Nuevo referenciador</h3>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Nombre *</label>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nombre" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Apellido</label>
            <Input value={newSurname} onChange={(e) => setNewSurname(e.target.value)} placeholder="Apellido" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Teléfono</label>
            <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="341 555-1234" />
          </div>
          <div className="flex items-end">
            <Button className="w-full" onClick={handleCreate} disabled={createMutation.isPending}>
              <Plus className="mr-1.5 h-4 w-4" />Agregar
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="mb-4 flex items-center gap-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input className="max-w-xs" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre..." />
        </div>

        {referenciadores.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {search ? 'Sin resultados.' : 'No hay referenciadores cargados.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border/60 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  <th className="px-3 py-3 text-left">Nombre</th>
                  <th className="px-3 py-3 text-left">Apellido</th>
                  <th className="px-3 py-3 text-left">Teléfono</th>
                </tr>
              </thead>
              <tbody>
                {referenciadores.map((r) => (
                  <tr key={r.id} className="border-b border-border/40 hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-3 font-medium">{r.nombre}</td>
                    <td className="px-3 py-3 text-muted-foreground">{r.apellido || '—'}</td>
                    <td className="px-3 py-3 text-muted-foreground">{r.telefono || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
