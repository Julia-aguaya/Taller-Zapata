import { useMemo, useState } from 'react';
import {
  getAgendaPriorityLabel,
  getAgendaPriorityTone,
  getAgendaStatusLabel,
  isAgendaTaskResolved,
  setAgendaTaskResolved,
  setAgendaTaskStatus,
  todayIso,
} from '../../cases/lib/caseAgendaHelpers';
import { TASK_STATUS_OPTIONS } from '../../gestion/constants/gestionOptions';
import { formatDate } from '../../cases/lib/caseFormatters';
import SelectField from '../../../components/ui/SelectField';
import StatusBadge from '../../../components/ui/StatusBadge';

export default function AgendaView({ items, onOpenCase, onUpdateTask }) {
  const [activeAgendaTab, setActiveAgendaTab] = useState('pendientes');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [isMobileCalendarVisible, setIsMobileCalendarVisible] = useState(false);
  const assigneeOptions = useMemo(() => [{ value: '', label: 'Todos los usuarios' }, ...new Set(items.map((task) => task.assignee).filter(Boolean))], [items]);

  const filteredItems = useMemo(
    () => items.filter((task) => !assigneeFilter || task.assignee === assigneeFilter),
    [assigneeFilter, items],
  );

  const counts = useMemo(() => ({
    pendientes: filteredItems.filter((task) => task.viewBucket === 'pendientes').length,
    resueltas: filteredItems.filter((task) => task.viewBucket === 'resueltas').length,
    vencidas: filteredItems.filter((task) => task.viewBucket === 'vencidas').length,
    proximas: filteredItems.filter((task) => !task.resolved && task.dueMeta.bucket === 'upcoming').length,
  }), [filteredItems]);

  const visibleItems = useMemo(() => filteredItems
    .filter((task) => {
      if (activeAgendaTab === 'proximas') {
        return !task.resolved && task.dueMeta.bucket === 'upcoming';
      }

      return task.viewBucket === activeAgendaTab;
    })
    .sort((left, right) => {
      const leftDate = left.scheduledAt || '9999-12-31';
      const rightDate = right.scheduledAt || '9999-12-31';

      if (activeAgendaTab === 'resueltas') {
        const leftResolutionDate = left.resolvedAt || left.scheduledAt || '';
        const rightResolutionDate = right.resolvedAt || right.scheduledAt || '';
        return rightResolutionDate.localeCompare(leftResolutionDate) || left.caseCode.localeCompare(right.caseCode);
      }

      return leftDate.localeCompare(rightDate) || left.caseCode.localeCompare(right.caseCode);
    }), [activeAgendaTab, filteredItems]);

  const calendarCells = useMemo(() => {
    const today = new Date(`${todayIso()}T12:00:00`);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1, 12, 0, 0);
    const startDay = (monthStart.getDay() + 6) % 7;
    const gridStart = new Date(monthStart);
    gridStart.setDate(monthStart.getDate() - startDay);

    return Array.from({ length: 35 }, (_, index) => {
      const current = new Date(gridStart);
      current.setDate(gridStart.getDate() + index);
      const iso = current.toISOString().slice(0, 10);
      const dayItems = filteredItems.filter((task) => task.scheduledAt === iso);

      return {
        iso,
        date: current,
        inCurrentMonth: current.getMonth() === today.getMonth(),
        tasks: dayItems,
      };
    });
  }, [filteredItems]);

  return (
    <div className="agenda-layout">
      <section className="hero-panel compact-hero agenda-hero">
        <div>
          <p className="eyebrow">Agenda transversal</p>
          <h1>Tareas por usuario y por caso</h1>
          <p className="muted">Consolida recordatorios reales de Gestión del trámite, Reparación y Abogado sin tocar el flujo principal del caso.</p>
        </div>
      </section>

      <section className="card inner-card agenda-filter-card">
        <div className="agenda-filter-head">
          <div className="agenda-filter-select">
            <SelectField label="Usuario" onChange={setAssigneeFilter} options={assigneeOptions} value={assigneeFilter} />
          </div>
          <div className="hero-actions agenda-hero-actions">
            <article className="metric-card">
              <span>Pendientes</span>
              <strong>{counts.pendientes}</strong>
              <small>Abiertas y no vencidas</small>
            </article>
            <article className="metric-card">
              <span>Resueltas</span>
              <strong>{counts.resueltas}</strong>
              <small>Marcadas como completadas</small>
            </article>
            <article className="metric-card">
              <span>Vencidas</span>
              <strong>{counts.vencidas}</strong>
              <small>Requieren atención hoy</small>
            </article>
          </div>
        </div>
      </section>

      <div className="agenda-content-grid">
        <article className="card inner-card agenda-tasks-card">
          <div className="section-head small-gap agenda-task-header">
            <div>
              <h3>Tareas</h3>
              <p className="muted">{assigneeFilter ? `${activeAgendaTab === 'resueltas' ? 'Resueltas' : activeAgendaTab === 'vencidas' ? 'Vencidas' : 'Pendientes'} de: ${assigneeFilter}` : activeAgendaTab === 'resueltas' ? 'Resueltas' : activeAgendaTab === 'vencidas' ? 'Vencidas' : 'Pendientes'}</p>
            </div>
            <div className="agenda-task-header-actions">
              <button
                aria-controls="agenda-calendar-panel"
                aria-expanded={isMobileCalendarVisible}
                className="secondary-button agenda-calendar-toggle"
                onClick={() => setIsMobileCalendarVisible((current) => !current)}
                type="button"
              >
                {isMobileCalendarVisible ? 'Ocultar calendario' : 'Ver calendario'}
              </button>
              <StatusBadge tone={activeAgendaTab === 'resueltas' ? 'success' : activeAgendaTab === 'vencidas' ? 'danger' : 'info'}>{visibleItems.length} tarea(s)</StatusBadge>
            </div>
          </div>
          <div className="agenda-view-tabs" role="tablist" aria-label="Filtros de tareas">
          {[
            { id: 'pendientes', label: 'Pendientes', count: counts.pendientes },
            { id: 'resueltas', label: 'Resueltas', count: counts.resueltas },
            { id: 'vencidas', label: 'Venció', count: counts.vencidas },
          ].map((tab) => (
            <button
              className={`compact-button agenda-tab-button ${activeAgendaTab === tab.id ? 'is-selected' : ''}`}
              key={tab.id}
              onClick={() => setActiveAgendaTab(tab.id)}
              type="button"
            >
              {tab.label} ({tab.count})
            </button>
          ))}
          </div>

          {visibleItems.length ? (
            <div className="table-wrap agenda-table-wrap">
              <table className="data-table compact-table agenda-table">
                <thead>
                  <tr>
                    <th>Tarea</th>
                    <th>Vinculo</th>
                    <th>Prioridad</th>
                    <th>Estado</th>
                    <th>Responsable</th>
                    <th>Fecha límite</th>
                    {activeAgendaTab === 'resueltas' ? <th>Fecha resolución</th> : null}
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleItems.map((task) => (
                    <tr className={`agenda-row is-${task.dueMeta.tone}`} key={`${task.caseId}-${task.collectionKey}-${task.id}`}>
                      <td data-label="Tarea">
                        <div className="agenda-task-copy">
                          <strong>{task.title || 'Tarea sin título'}</strong>
                          <small>{task.description || 'Sin descripción operativa.'}</small>
                        </div>
                      </td>
                      <td data-label="Vinculo">
                        <div className="agenda-task-linkage">
                          <strong>{task.caseCode}</strong>
                          <small>{task.sourceLabel}</small>
                        </div>
                      </td>
                      <td data-label="Prioridad"><StatusBadge tone={getAgendaPriorityTone(task.priority)}>{getAgendaPriorityLabel(task.priority)}</StatusBadge></td>
                      <td data-label="Estado">
                        <SelectField
                          label="Estado"
                          onChange={(value) => onUpdateTask(task, (draftTask) => setAgendaTaskStatus(draftTask, value))}
                          options={TASK_STATUS_OPTIONS.map((value) => ({ value, label: getAgendaStatusLabel(value) }))}
                          value={task.status}
                        />
                      </td>
                      <td data-label="Responsable">{task.assignee}</td>
                      <td data-label="Fecha limite">
                        <div className="agenda-task-due">
                          <strong>{formatDate(task.scheduledAt)}</strong>
                          <small>{task.dueMeta.label}</small>
                        </div>
                      </td>
                      {activeAgendaTab === 'resueltas' ? (
                        <td data-label="Fecha resolucion">
                          <div className="agenda-task-due">
                            <strong>{formatDate(task.resolvedAt || task.scheduledAt)}</strong>
                            <small>{task.resolvedAt ? 'Resuelta' : 'Sin fecha de cierre'}</small>
                          </div>
                        </td>
                      ) : null}
                      <td data-label="Accion">
                        <div className="agenda-action-group">
                          <button
                            className="secondary-button"
                            onClick={() => onOpenCase(task.caseId, { tab: task.relatedTab || 'tramite', subtab: task.relatedSubtab || '' })}
                            type="button"
                          >
                            Abrir
                          </button>
                          <button
                            aria-label={task.resolved ? 'Reabrir tarea' : 'Marcar resuelta'}
                            className="ghost-button"
                            onClick={() => onUpdateTask(task, (draftTask) => setAgendaTaskResolved(draftTask, !isAgendaTaskResolved(draftTask)))}
                            type="button"
                          >
                            ✓
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-media agenda-empty-state">No hay tareas para mostrar en esta combinación de filtros.</div>
          )}
        </article>

        <article className={`card inner-card agenda-calendar-card ${isMobileCalendarVisible ? 'is-mobile-visible' : ''}`} id="agenda-calendar-panel">
          <div className="section-head small-gap">
            <div>
              <h3>Calendario</h3>
              <p className="muted">Vista mensual simple con concentración de vencimientos por día.</p>
            </div>
            <StatusBadge tone="info">Demo simple</StatusBadge>
          </div>
          <div className="agenda-calendar-weekdays">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className="agenda-calendar-grid">
            {calendarCells.map((cell) => {
              const dueTone = cell.tasks.some((task) => task.dueMeta.bucket === 'overdue')
                ? 'danger'
                : cell.tasks.some((task) => task.dueMeta.bucket === 'upcoming')
                  ? 'warning'
                  : 'info';

              return (
                <article className={`agenda-calendar-cell ${cell.inCurrentMonth ? '' : 'is-muted'} ${cell.iso === todayIso() ? 'is-today' : ''}`} key={cell.iso}>
                  <div className="agenda-calendar-head">
                    <strong>{cell.date.getDate()}</strong>
                    {cell.tasks.length ? <StatusBadge tone={dueTone}>{cell.tasks.length}</StatusBadge> : null}
                  </div>
                  <div className="agenda-calendar-items">
                    {cell.tasks.slice(0, 3).map((task) => (
                      <button className={`agenda-calendar-task is-${task.dueMeta.tone}`} key={task.id} onClick={() => onOpenCase(task.caseId, { tab: task.relatedTab || 'tramite', subtab: task.relatedSubtab || '' })} type="button">
                        {task.caseCode} · {task.title || 'Tarea'}
                      </button>
                    ))}
                    {cell.tasks.length > 3 ? <small>+{cell.tasks.length - 3} más</small> : null}
                  </div>
                </article>
              );
            })}
          </div>
        </article>
      </div>
    </div>
  );
}
