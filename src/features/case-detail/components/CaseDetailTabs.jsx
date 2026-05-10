import { useState } useEffect from 'react';
import { useCaseDetail } from '../hooks/useCaseDetail';

const TABS = [
  { id: 'ficha', label: 'Ficha', endpoint: '' },
  { id: 'workflow', label: 'Workflow', endpoint: '/workflow' },
  { id: 'turnos', label: 'Turnos', endpoint: '/appointments' },
  { id: 'documentos', label: 'Documentos', endpoint: '/documents' },
  { id: 'auditoria', label: 'Auditoría', endpoint: '/audit' },
];

export function CaseDetailTabs({ caseId }) {
  const [activeTab, setActiveTab] = useState('ficha');
  const { data, loading, error, fetchTab } = useCaseDetail(caseId);
  
  const handleTabChange = async (tabId) => {
    setActiveTab(tabId);
    const tab = TABS.find(t => t.id === tabId);
    if (tab && tab.endpoint) {
      await fetchTab(tab.endpoint);
    }
  };
  
  const currentTabData = activeTab === 'ficha' ? data : data?.tabs?.[activeTab];
  const isLoading = loading.tabs?.[activeTab] || false;
  const tabError = error.tabs?.[activeTab];
  
  return (
    <div className="case-detail-tabs">
      <div className="tabs-navigation" role="tablist">
        {TABS.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => handleTabChange(tab.id)}
            disabled={isLoading}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      <div className="tab-content" role="tabpanel">
        {isLoading && <div className="loading-skeleton">Cargando...</div>}
        {tabError && (
          <div className="error-message">
            Error al cargar: {tabError.message}
            <button onClick={() => fetchTab(TABS.find(t => t.id === activeTab).endpoint)}>
              Reintentar
            </button>
          </div>
        )}
        {!isLoading && !tabError && (
          <div className="tab-panel-content">
            {/* Content would be rendered here */}
          </div>
        )}
      </div>
    </div>
  );
}