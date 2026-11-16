import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { HttpError, apiRequest, friendlyMessage } from './api';

// Loads GET `path` with the logged-in user's token. It reloads whenever `path` changes (for example when a
// filter changes) and cancels a request that is still running when that happens, so an old answer can never
// overwrite a newer one. A 401 means the token is no longer valid, so the user is logged out.
export function useApiData(path) {
  const { token, logout } = useAuth();
  const [state, setState] = useState({ status: 'loading', data: null, error: '' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState((current) => ({ ...current, status: 'loading' }));
    apiRequest(path, { token, signal: controller.signal })
      .then((data) => setState({ status: 'success', data, error: '' }))
      .catch((error) => {
        if (error.name === 'AbortError') return;
        if (error instanceof HttpError && error.status === 401) {
          logout();
          return;
        }
        setState({ status: 'error', data: null, error: friendlyMessage(error) });
      });
    return () => controller.abort();
  }, [path, token, logout, attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);
  // Replaces one item in the loaded list (after a row was changed) without reloading everything.
  const replaceItem = useCallback(
    (item) =>
      setState((current) =>
        current.data ? { ...current, data: current.data.map((row) => (row.id === item.id ? { ...row, ...item } : row)) } : current,
      ),
    [],
  );

  return { ...state, reload, replaceItem };
}
