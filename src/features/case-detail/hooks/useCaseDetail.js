/**
 * useCaseDetail hook
 * Manages case detail state, loading, and subresource fetching
 */
import { useState, useEffect, useCallback } from 'react';
import { loadCaseDetailBundle } from '../lib/loadCaseDetailBundle';
import { buildCaseDetailState } from '../lib/buildCaseDetailState';

export function useCaseDetail(accessToken, caseId) {
  const [state, setState] = useState({
    item: null,
    status: 'initial', // initial, loading, success, error, partial
    error: null,
    subresourceErrors: {},
  });

  const [detailState, setDetailState] = useState(null);

  // Load case detail when accessToken or caseId changes
  useEffect(() => {
    if (!accessToken || !caseId) {
      setState({ item: null, status: 'initial', error: null, subresourceErrors: {} });
      setDetailState(null);
      return;
    }

    const controller = new AbortController();
    let isMounted = true;

    const load = async () => {
      setState((prev) => ({ ...prev, status: 'loading', error: null }));

      try {
        const { bundled, errors, hasErrors } = await loadCaseDetailBundle(
          accessToken,
          caseId,
          controller.signal
        );

        if (!isMounted) return;

        // Build state from bundle
        const builtState = buildCaseDetailState(bundled);
        
        setDetailState(builtState);
        
        setState({
          item: builtState.item,
          status: hasErrors ? 'partial' : builtState.status,
          error: builtState.error,
          subresourceErrors: errors,
        });
      } catch (err) {
        if (!isMounted || err.name === 'AbortError') return;
        
        setState({
          item: null,
          status: 'error',
          error: err.message || 'Error al cargar el caso',
          subresourceErrors: {},
        });
      }
    };

    load();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [accessToken, caseId]);

  const refresh = useCallback(() => {
    if (!accessToken || !caseId) return;
    
    const controller = new AbortController();
    
    const load = async () => {
      try {
        const { bundled, errors, hasErrors } = await loadCaseDetailBundle(
          accessToken,
          caseId,
          controller.signal
        );
        
        const builtState = buildCaseDetailState(bundled);
        setDetailState(builtState);
        
        setState({
          item: builtState.item,
          status: hasErrors ? 'partial' : builtState.status,
          error: builtState.error,
          subresourceErrors: errors,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          setState((prev) => ({ ...prev, error: err.message }));
        }
      }
    };
    
    load();
    
    return () => controller.abort();
  }, [accessToken, caseId]);

  return {
    // Main state
    item: state.item,
    status: state.status,
    error: state.error,
    isLoading: state.status === 'loading',
    isError: state.status === 'error',
    isSuccess: state.status === 'success' || state.status === 'partial',
    isPartial: state.status === 'partial',
    
    // Subresources
    subresourceErrors: state.subresourceErrors,
    hasSubresourceErrors: Object.keys(state.subresourceErrors).length > 0,
    
    // Detail state (includes all subresources)
    detailState,
    
    // Actions
    refresh,
  };
}