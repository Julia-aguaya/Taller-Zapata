export default function LegalNewsDetailBlock({
  legalNewsState,
  formatBackendState,
  formatDate,
  formatDateTime,
  StatusBadge,
}) {
  return (
    <section className="backend-detail-section backend-section-legal-news">
      <div className="stack-tight">
        <span className="backend-detail-section-kicker">Novedades</span>
        <h4>Novedades legales</h4>
      </div>

      <div className="backend-document-summary" role="list" aria-label="Resumen de novedades legales">
        <article className="backend-document-summary-card" role="listitem">
          <span>Novedades</span>
          <strong>{legalNewsState.total}</strong>
          <small>Registros recientes del frente legal.</small>
        </article>
      </div>

      {legalNewsState.status === 'loading' ? (
        <div className="backend-cases-empty" role="status" aria-live="polite">
          <strong>Estamos cargando las novedades legales.</strong>
          <p>{legalNewsState.detail || 'En unos instantes vas a ver esta información.'}</p>
        </div>
      ) : legalNewsState.status === 'success' ? (
        <div className="backend-timeline backend-item-list-horizontal" role="list" aria-label="Novedades legales de la carpeta">
          {legalNewsState.items.slice(0, 6).map((news, index) => (
            <article className="backend-timeline-item" key={news.id || news.publicId || `${news.newsDate || news.createdAt || 'legal-news'}-${index}`} role="listitem">
              <div className="backend-document-card-head">
                <div className="stack-tight">
                  <span className="client-case-kicker">{formatBackendState(news.typeCode || news.categoryCode || 'Novedad')}</span>
                  <strong>{news.title || news.summary || 'Novedad legal registrada'}</strong>
                </div>
                <StatusBadge tone="info">{formatDate(news.newsDate || news.createdAt)}</StatusBadge>
              </div>
              {news.detail || news.description ? <p>{news.detail || news.description}</p> : null}
              <small>{formatDateTime(news.createdAt || news.newsDate)}</small>
            </article>
          ))}
        </div>
      ) : legalNewsState.status === 'error' ? (
        <div className="backend-cases-empty" role="status">
          <strong>No pudimos mostrar las novedades legales de esta carpeta.</strong>
          <p>{legalNewsState.detail || 'Intentá nuevamente en unos instantes.'}</p>
        </div>
      ) : (
        <div className="backend-cases-empty" role="status">
          <strong>Todavía no vemos novedades legales cargadas para esta carpeta.</strong>
          <p>{legalNewsState.detail || 'Cuando se registren, vas a verlas acá.'}</p>
        </div>
      )}
    </section>
  );
}
