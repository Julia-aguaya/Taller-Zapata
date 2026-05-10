import { useEffect, useState } from 'react';

export function CaseDetailLoading({ caseId, onRetry }) {
  const [loadingState, setLoadingState] = useState('initial');
  const [partialData, setPartialData] = useState({});
  const [error, setError] = useState(null);
  
  useEffect(() => {
    loadCaseData();
  }, [caseId]);
  
  async function loadCaseData() {
    setLoadingState('loading');
    setError(null);
    
    try {
      const response = await fetch(`/api/v1/cases/${caseId}`, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setPartialData(data);
      setLoadingState('success');
    } catch (err) {
      if (err.message.includes('partial') || err.status === 206) {
        setPartialData(err.partialData || {});
        setLoadingState('partial');
        setError(err);
      } else {
        setError(err);
        setLoadingState('error');
      }
    }
  }
  
  if (loadingState === 'initial' || loadingState === 'loading') {
    return (
      <div className="case-detail-loading">
        <div className="skeleton-header" />
        <div className="skeleton-content">
          <div className="skeleton-line" />
          <div className="skeleton-line" />
          <div className="skeleton-line short" />
        </div>
      </div>
    );
  }
  
  if (loadingState === 'error') {
    return (
      <div className="case-detail-error">
        <p>Error al cargar el caso: {error?.message}</p>
        <button onClick={loadCaseData}>Reintentar</button>
      </div>
    );
  }
  
  if (loadingState === 'partial') {
    return (
      <div className="case-detail-partial">
        {partialData.case && (
          <div className="partial-case-info">
            <h2>{partialData.case.caseNumber}</h2>
          </div>
        )}
        <div className="partial-error">
          <p>Algunos datos no pudieron cargarse</p>
          <button onClick={loadCaseData}>Reintentar</button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="case-detail-content">
      {/* Full content would be rendered here */}
    </div>
  );
}