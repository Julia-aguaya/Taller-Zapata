import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { listCases } from '@/modules/cases/api/cases-api';
import { getCaseCatalogs, getInsuranceCatalogs } from '@/modules/cases/api/new-case-api';
import { listOperationalTasks } from '@/modules/agenda/api/agenda-api';
import { FullScreenLoader } from '@/shared/ui/full-screen-loader';
import { EmptyState } from '@/shared/ui/empty-state';
import { CasesPageContent } from '@/modules/cases/components/cases-page-content';

export const CasesPage = () => {
  const navigate = useNavigate();
  const [appliedBackendFilters, setAppliedBackendFilters] = useState({});
  const [lastSuccessfulCasesPayload, setLastSuccessfulCasesPayload] = useState(null);
  const [lastSuccessfulFilterSourcePayload, setLastSuccessfulFilterSourcePayload] = useState(null);

  const catalogsQuery = useQuery({
    queryKey: ['cases', 'catalogs'],
    queryFn: getCaseCatalogs,
  });

  const insuranceCatalogsQuery = useQuery({
    queryKey: ['cases', 'insurance-catalogs'],
    queryFn: getInsuranceCatalogs,
    retry: false,
  });

  const pendingTasksQuery = useQuery({
    queryKey: ['cases', 'pending-tasks-options'],
    queryFn: () => listOperationalTasks({ size: 500 }),
    retry: false,
  });

  const casesQuery = useQuery({
    queryKey: ['cases', 'list', appliedBackendFilters],
    queryFn: () => listCases({ size: 200, ...appliedBackendFilters }),
    placeholderData: (previousData) => previousData,
  });

  const casesOptionsQuery = useQuery({
    queryKey: ['cases', 'list', 'filter-options-source'],
    queryFn: () => listCases({ size: 200 }),
    placeholderData: (previousData) => previousData,
  });

  useEffect(() => {
    if (casesQuery.isSuccess && casesQuery.data) {
      setLastSuccessfulCasesPayload(casesQuery.data);
    }
  }, [casesQuery.data, casesQuery.isSuccess]);

  useEffect(() => {
    if (casesOptionsQuery.isSuccess && casesOptionsQuery.data) {
      setLastSuccessfulFilterSourcePayload(casesOptionsQuery.data);
    }
  }, [casesOptionsQuery.data, casesOptionsQuery.isSuccess]);

  const visibleCasesPayload = casesQuery.data ?? lastSuccessfulCasesPayload;
  const visibleFilterSourcePayload = casesOptionsQuery.data ?? lastSuccessfulFilterSourcePayload;

  if (!visibleCasesPayload && (casesQuery.isLoading || catalogsQuery.isLoading)) {
    return <FullScreenLoader label="Cargando carpetas..." compact />;
  }

  if (!visibleCasesPayload && casesQuery.isError) {
    return <EmptyState title="No pude cargar las carpetas" description={casesQuery.error.message} />;
  }

  if (catalogsQuery.isError) {
    return <EmptyState title="No pude cargar los catalogos de carpetas" description={catalogsQuery.error.message} />;
  }

  const payload = visibleCasesPayload || {};
  const filterSourcePayload = visibleFilterSourcePayload || {};

  return (
    <CasesPageContent
      items={payload.items ?? []}
      totalCount={filterSourcePayload.totalElements}
      filterSourceItems={filterSourcePayload.items ?? []}
      caseTypes={catalogsQuery.data?.caseTypes ?? []}
      insuranceCatalogs={insuranceCatalogsQuery.isSuccess ? insuranceCatalogsQuery.data : null}
      insuranceCatalogsUnavailable={insuranceCatalogsQuery.isError}
      pendingTasks={pendingTasksQuery.data?.items ?? pendingTasksQuery.data?.content ?? pendingTasksQuery.data ?? []}
      pendingTasksUnavailable={pendingTasksQuery.isError}
      requestErrorMessage={casesQuery.isError ? casesQuery.error?.message || 'No pude actualizar las carpetas.' : ''}
      isRefreshing={casesQuery.isFetching}
      onApplyFilters={setAppliedBackendFilters}
      onOpenCase={(item) => navigate(`/cases/${item.id}`)}
    />
  );
};
