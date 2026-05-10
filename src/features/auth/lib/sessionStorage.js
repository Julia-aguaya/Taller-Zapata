/**
 * Session storage utilities
 * Wraps backend.js session functions with a cleaner API
 */
import { readBackendSession, storeBackendSession, clearBackendSession } from '../../../lib/api/backend';

export function getStoredSession() {
  return readBackendSession();
}

export function saveSession(session) {
  storeBackendSession(session);
}

export function clearSession() {
  clearBackendSession();
}

export function hasStoredSession() {
  const session = readBackendSession();
  return Boolean(session?.accessToken);
}

export function isSessionValid(session) {
  if (!session?.accessToken) return false;
  if (!session?.expiresAt) return true;
  
  return new Date(session.expiresAt) > new Date();
}