export default function AppointmentsDetailBlock({ appointmentsState, formatDate, formatAppointmentTime, getAppointmentStatusTone, formatBackendState, StatusBadge }) {
  return (
    <section className="backend-detail-section backend-section-appointments">
      <div className="stack-tight"><span className="backend-detail-section-kicker">Turnos</span><h4>Recepción del vehículo</h4></div>
      <div className="backend-document-summary" role="list" aria-label="Resumen de turnos de la carpeta">
        <article className="backend-document-summary-card" role="listitem"><span>Turnos registrados</span><strong>{appointmentsState.total}</strong><small>Incluye turnos nuevos y reprogramaciones de esta carpeta.</small></article>
        <article className="backend-document-summary-card" role="listitem"><span>{appointmentsState.total > 0 && !appointmentsState.hasUpcomingAppointment ? 'Última fecha cargada' : 'Próxima fecha'}</span><strong>{appointmentsState.nextAppointment?.appointmentDate ? formatDate(appointmentsState.nextAppointment.appointmentDate) : '-'}</strong><small>{appointmentsState.nextAppointment?.appointmentTime ? `Horario ${formatAppointmentTime(appointmentsState.nextAppointment.appointmentTime)}` : 'Todavía no hay horario visible.'}</small></article>
      </div>

      {appointmentsState.status === 'loading' ? (
        <div className="backend-cases-empty" role="status" aria-live="polite"><strong>Estamos cargando los turnos de esta carpeta.</strong><p>{appointmentsState.detail || 'En unos instantes vas a ver las fechas disponibles.'}</p></div>
      ) : appointmentsState.status === 'success' ? (
        <div className="backend-appointment-list backend-item-list-horizontal" role="list" aria-label="Turnos de la carpeta">
          {appointmentsState.items.map((appointment) => (
            <article className="backend-appointment-card" key={appointment.id || appointment.publicId} role="listitem">
              <div className="backend-document-card-head">
                <div className="stack-tight"><span className="client-case-kicker">{appointment.reentry ? 'Reingreso' : 'Ingreso programado'}</span><strong>{appointment.appointmentDate ? formatDate(appointment.appointmentDate) : 'Fecha a confirmar'}</strong></div>
                <StatusBadge tone={getAppointmentStatusTone(appointment.statusCode)}>{formatBackendState(appointment.statusCode, 'Programado')}</StatusBadge>
              </div>
              <div className="backend-appointment-meta" role="list" aria-label="Datos del turno">
                <div className="backend-appointment-meta-item" role="listitem"><span>Horario</span><strong>{formatAppointmentTime(appointment.appointmentTime)}</strong></div>
                <div className="backend-appointment-meta-item" role="listitem"><span>Salida estimada</span><strong>{appointment.estimatedExitDate ? formatDate(appointment.estimatedExitDate) : 'A confirmar'}</strong></div>
                <div className="backend-appointment-meta-item" role="listitem"><span>Días estimados</span><strong>{appointment.estimatedDays ? `${appointment.estimatedDays} día${appointment.estimatedDays === 1 ? '' : 's'}` : 'Sin dato'}</strong></div>
              </div>
              {appointment.notes ? <p className="backend-appointment-note">{appointment.notes}</p> : null}
            </article>
          ))}
        </div>
      ) : appointmentsState.status === 'error' ? (
        <div className="backend-cases-empty" role="status"><strong>No pudimos mostrar los turnos de esta carpeta.</strong><p>{appointmentsState.detail || 'Intentá nuevamente en unos instantes.'}</p></div>
      ) : (
        <div className="backend-cases-empty" role="status"><strong>Todavía no vemos turnos asignados para esta carpeta.</strong><p>Cuando el taller confirme una fecha de recepción, la vas a ver acá.</p></div>
      )}

      {appointmentsState.detail && appointmentsState.status !== 'loading' && appointmentsState.status !== 'error' ? (
        <div className="backend-detail-notice" role="status"><p>{appointmentsState.detail}</p></div>
      ) : null}
    </section>
  );
}
