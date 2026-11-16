import { createContext, useCallback, useContext, useMemo, useState } from 'react';

// The JWT (and the user it belongs to) is kept in localStorage so a refresh does not log you out.
export const TOKEN_KEY = 'library-token';
export const USER_KEY = 'library-user';

// Reads the "exp" claim of a JWT. Returns true only when the token says it has expired.
// A token we cannot decode is left for the server to judge (it answers 401 if it is bad).
function isExpired(token) {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const { exp } = JSON.parse(atob(payload));
    return typeof exp === 'number' && exp * 1000 <= Date.now();
  } catch {
    return false;
  }
}

function clearStored() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    // storage is blocked, nothing to clear
  }
}

function readStored() {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const user = JSON.parse(localStorage.getItem(USER_KEY));
    if (token && user && !isExpired(token)) return { token, user };
  } catch {
    // unreadable or blocked storage: act as logged out
  }
  clearStored();
  return { token: null, user: null };
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(readStored);

  // `data` is what POST /auth/login returns: { access_token, user }.
  const login = useCallback((data) => {
    try {
      localStorage.setItem(TOKEN_KEY, data.access_token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    } catch {
      // still logged in for this visit even if the browser refuses to store it
    }
    setAuth({ token: data.access_token, user: data.user });
  }, []);

  const logout = useCallback(() => {
    clearStored();
    setAuth({ token: null, user: null });
  }, []);

  const value = useMemo(
    () => ({ token: auth.token, user: auth.user, isLoggedIn: Boolean(auth.token), login, logout }),
    [auth, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>');
  return value;
}
