export default function BlockingDocGateModal({ isOpen, message, onAccept }) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="blocking-modal-overlay" role="presentation">
      <div aria-labelledby="doc-gate-title" aria-modal="true" className="blocking-modal" role="dialog">
        <p className="eyebrow">Aviso bloqueante</p>
        <h3 id="doc-gate-title">Carpeta con documentación pendiente</h3>
        <p className="muted">{message}</p>
        <div className="blocking-modal-actions">
          <button className="primary-button" onClick={onAccept} type="button">Aceptar</button>
        </div>
      </div>
    </div>
  );
}
