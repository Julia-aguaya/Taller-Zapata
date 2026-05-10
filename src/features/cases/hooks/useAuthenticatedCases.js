/**
 * useAuthenticatedCases hook
 * Manages case list state, fetching, filtering, and metrics
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { filterCases, getBranchOptions, getStateOptions, calculateCaseMetrics } from '../lib/caseFilters';
import { readAuthenticatedCases } from '../../../lib/api/backend';

export function useAuthenticatedCases(accessToken) {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('initial'); // initial, loading, success, error
  const [error, setError] = useState(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCaseState, setSelectedCaseState] = useState('all');
  const [selectedBranch, setSelectedBranch] = useState('all');
  
  // Fetch cases
  const fetchCases = useCallback(async (signal) => {
    if (!accessToken) return;
    
    setStatus('loading');
    setError(null);
    
    try {
      const result = await readAuthenticatedCases(accessToken, signal);
      setItems(result.items || []);
      setStatus('success');
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err);
        setStatus('error');
      }
    }
  }, [accessToken]);
  
  // Initial fetch
  useEffect(() => {
    if (!accessToken) {
      setStatus('initial');
      return;
    }
    
    const controller = new AbortController();
    fetchCases(controller.signal);
    
    return () => controller.abort();
  }, [accessToken, fetchCases]);
  
  // Filtered items
  const filteredItems = useMemo(() => {
    return filterCases(items, {
      searchTerm,
      caseState: selectedCaseState,
      branch: selectedBranch,
    });
  }, [items, searchTerm, selectedCaseState, selectedBranch]);
  
  // Options
  const branchOptions = useMemo(() => getBranchOptions(items), [items]);
  const caseStateOptions = useMemo(() => getStateOptions(items), [items]);
  
  // Metrics
  const metrics = useMemo(() => calculateCaseMetrics(filteredItems), [filteredItems]);
  
  const refresh = useCallback(() => {
    const controller = new AbortController();
    fetchCases(controller.signal);
  }, [fetchCases]);
  
  return {
    // Data
    items,
    filteredItems,
    metrics,
    
    // Status
    status,
    error,
    isLoading: status === 'loading',
    isError: status === 'error',
    isSuccess: status === 'success',
    
    // Filters
    searchTerm,
    setSearchTerm,
    selectedCaseState,
    setSelectedCaseState,
    selectedBranch,
    setSelectedBranch,
    
    // Options
    branchOptions,
    caseStateOptions,
    
    // Actions
    refresh,
  };
}