import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckSquare, ListTodo, Plus, Save } from 'lucide-react';
import { toast } from 'sonner';
import { requestJson } from '@/shared/api/http-client';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

const DATE_FMT = new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' });

export const TaskAgenda = ({ caseId, organizationId, branchId }) => {
  const queryClient = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDueDate, setNewDueDate] = useState('');

  const tasksQuery = useQuery({
    queryKey: ['tasks', String(caseId)],
    queryFn: () => requestJson(`/tasks?caseId=${caseId}&size=100`),
  });

  const tasks = (tasksQuery.data?.content ?? tasksQuery.data ?? []);
  const pendingTasks = Array.isArray(tasks) ? tasks.filter(t => !t.resolved) : [];

  const createMutation = useMutation({
    mutationFn: (payload) => requestJson('/tasks', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tasks', String(caseId) ] }); toast.success('Tarea creada.'); setShowNew(false); setNewTitle(''); setNewDesc(''); setNewDueDate(''); },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ taskId, payload }) => requestJson(`/tasks/${taskId}`, { method: 'PUT', body: JSON.stringify(payload) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tasks', String(caseId) ] }); toast.success('Tarea actualizada.'); },
    onError: (e) => toast.error(e.message),
  });

  const toggleResolved = (task) => {
    updateMutation.mutate({ taskId: task.id, payload: {
      ...task,
      resolved: !task.resolved,
      statusCode: !task.resolved ? 'RESUELTA' : (task.statusCode ?? 'PENDIENTE'),
    }});
  };

  const handleCreate = () => {
    if (!newTitle.trim()) { toast.error('Ingresá un título.'); return; }
    createMutation.mutate({
      caseId,
      organizationId: organizationId ?? 1,
      branchId: branchId ?? 1,
      title: newTitle.trim(),
      description: newDesc.trim() || null,
      dueDate: newDueDate || null,
      priorityCode: 'MEDIA',
      statusCode: 'PENDIENTE',
      originModuleCode: 'TRAMITE',
      originSubtabCode: 'agenda',
      assignedUserId: null,
    });
  };

  return (
    <div className="rounded-3xl border border-border/70 bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ListTodo className="h-5 w-5" />
          </div>
          <h4 className="text-sm font-semibold">Agenda de tareas</h4>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowNew(true)}><Plus className="mr-1.5 h-3.5 w-3.5" />Agregar item</Button>
      </div>

      {/* New task form */}
      {showNew ? (
        <div className="mt-4 rounded-2xl border border-dashed border-border/60 bg-background/50 p-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Título</label>
              <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Describí la tarea pendiente..." />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Descripción</label>
              <Input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Detalle opcional..." />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Fecha límite</label>
              <Input type="date" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={handleCreate} disabled={createMutation.isPending}><Save className="mr-1.5 h-3.5 w-3.5" />Guardar</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowNew(false)}>Cancelar</Button>
          </div>
        </div>
      ) : null}

      {/* Task table */}
      {pendingTasks.length > 0 ? (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-border/50 text-muted-foreground">
                <th className="px-2 py-2 text-left font-semibold uppercase tracking-wider">Pendiente</th>
                <th className="px-2 py-2 text-left font-semibold uppercase tracking-wider">Agendado</th>
                <th className="px-2 py-2 text-left font-semibold uppercase tracking-wider">Hecho</th>
              </tr>
            </thead>
            <tbody>
              {pendingTasks.map((task) => (
                <tr key={task.id} className="border-b border-border/20 hover:bg-muted/30">
                  <td className="px-2 py-2.5 max-w-[300px]">
                    <p className="font-medium">{task.title}</p>
                    {task.description ? <p className="text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p> : null}
                  </td>
                  <td className="px-2 py-2.5 text-muted-foreground whitespace-nowrap">
                    {task.dueDate ?? '—'}
                  </td>
                  <td className="px-2 py-2.5">
                    <input type="checkbox" checked={task.resolved} onChange={() => toggleResolved(task)}
                      className="h-4 w-4 rounded border-border accent-primary cursor-pointer" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-4 text-xs text-muted-foreground">No hay tareas pendientes.</p>
      )}
    </div>
  );
};
