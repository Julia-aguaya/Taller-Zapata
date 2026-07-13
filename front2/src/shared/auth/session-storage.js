const STORAGE_KEY = 'front2.session.v1';

export const readStoredAuth = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!parsed?.accessToken || !parsed?.refreshToken) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

export const saveStoredAuth = (payload) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
};

export const clearStoredAuth = () => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
};
