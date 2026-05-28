export default function BlockingDocGateModal({
  isOpen,
  message,
  onAccept,
  onCancel = null,
  title = 'Carpeta con documentación pendiente',
  eyebrow = 'Aviso bloqueante',
  acceptLabel = 'Aceptar',
  cancelLabel = 'Cancelar',
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="blocking-modal-overlay" role="presentation">
      <div aria-labelledby="doc-gate-title" aria-modal="true" className="blocking-modal" role="dialog">
        <p className="eyebrow">{eyebrow}</p>
        <h3 id="doc-gate-title">{title}</h3>
        <p className="muted">{message}</p>
        <div className="blocking-modal-actions">
          {onCancel ? <button className="secondary-button" onClick={onCancel} type="button">{cancelLabel}</button> : null}
          <button className="primary-button" onClick={onAccept} type="button">{acceptLabel}</button>
        </div>
      </div>
    </div>
  );
}
