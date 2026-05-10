import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AgendaView from '../../../features/agenda/components/AgendaView';

const mockTask = {
  id: 'task-1',
  caseCode: '0001PZ',
  caseId: 'case-1',
  title: 'Cargar presupuesto',
  description: 'Completar items',
  assignee: 'Juan Perez',
  assigneeId: 'user-1',
  scheduledAt: '2026-03-15',
  resolved: false,
  resolvedAt: null,
  status: 'pendiente',
  priority: 'alta',
  viewBucket: 'pendientes',
  dueMeta: { label: 'Vence en 5 dias', bucket: 'upcoming', isOverdue: false },
};

const mockTasks = [
  mockTask,
  {
    ...mockTask,
    id: 'task-2',
    caseCode: '0002PZ',
    title: 'Confirmar turno',
    assignee: 'Maria Gomez',
    assigneeId: 'user-2',
    priority: 'media',
  },
];

describe('AgendaView - Smoke', () => {
  const onOpenCase = vi.fn();
  const onUpdateTask = vi.fn();

  it('deberia renderizar el titulo de la agenda', () => {
    render(<AgendaView items={mockTasks} onOpenCase={onOpenCase} onUpdateTask={onUpdateTask} />);

    expect(screen.getByText('Agenda transversal')).toBeInTheDocument();
    expect(screen.getByText('Tareas por usuario y por caso')).toBeInTheDocument();
  });

  it('deberia mostrar filtro de usuario', () => {
    render(<AgendaView items={mockTasks} onOpenCase={onOpenCase} onUpdateTask={onUpdateTask} />);

    expect(screen.getByText('Todos los usuarios')).toBeInTheDocument();
  });

  it('deberia mostrar metrica de pendientes', () => {
    render(<AgendaView items={mockTasks} onOpenCase={onOpenCase} onUpdateTask={onUpdateTask} />);

    const pendientesEls = screen.getAllByText(/pendientes/i);
    expect(pendientesEls.length).toBeGreaterThanOrEqual(1);
  });

  it('deberia renderizar sin errores con lista vacia', () => {
    render(<AgendaView items={[]} onOpenCase={onOpenCase} onUpdateTask={onUpdateTask} />);

    expect(screen.getByText('Agenda transversal')).toBeInTheDocument();
    expect(screen.getByText('Todos los usuarios')).toBeInTheDocument();
  });

  it('deberia mostrar lista de tareas cuando hay items', () => {
    render(<AgendaView items={mockTasks} onOpenCase={onOpenCase} onUpdateTask={onUpdateTask} />);

    expect(screen.getByText('Cargar presupuesto')).toBeInTheDocument();
    expect(screen.getByText('Confirmar turno')).toBeInTheDocument();
  });
});
