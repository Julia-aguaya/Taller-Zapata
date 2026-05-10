/**
 * useBackendSession hook
 * Manages authentication state and session lifecycle
 */
import { useState, useEffect, useCallback } from 'react';
import { getStoredSession, saveSession, clearSession, isSessionValid } from '../lib/sessionStorage';

export function useBackendSession() {
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize session from storage
  useEffect(() => {
    const stored = getStoredSession();
    if (stored && isSessionValid(stored)) {
      setSession(stored);
      setIsAuthenticated(true);
    } else if (stored) {
      // Session expired, clear it
      clearSession();
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((newSession) => {
    saveSession(newSession);
    setSession(newSession);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
    setIsAuthenticated(false);
  }, []);

  const refreshSession = useCallback((updatedSession) => {
    saveSession(updatedSession);
    setSession(updatedSession);
  }, []);

  return {
    session,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshSession,
  };
}