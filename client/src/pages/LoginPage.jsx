import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HttpError, apiRequest, friendlyMessage } from '../lib/api';

// A controlled form: the inputs show whatever is in state, and onChange updates the state on every
// keystroke. On submit it posts to POST /auth/login and keeps the JWT it gets back.
export default function LoginPage() {
  const { login, isLoggedIn } = useAuth();
  const location = useLocation();
  const from = location.state && location.state.from ? location.state.from.pathname : '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Once login() has stored the token this page re-renders and sends the visitor back to the
  // page they were trying to reach (or the catalog).
  if (isLoggedIn) return <Navigate to={from} replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const data = await apiRequest('/auth/login', { method: 'POST', body: { email: email.trim(), password } });
      login(data);
    } catch (err) {
      setError(err instanceof HttpError && err.status === 429 ? 'Too many attempts. Wait a minute and try again.' : friendlyMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <section className="form-card">
      <h1>Log in</h1>
      {from !== '/' && <p className="lead">Log in to continue.</p>}

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-field">
          <label htmlFor="login-email">Email</label>
          <input id="login-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="form-field">
          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="button" disabled={submitting}>
          {submitting ? 'Logging in...' : 'Log in'}
        </button>
      </form>

      <p className="form-footer">
        New here? <Link to="/register" state={location.state}>Create an account</Link>
      </p>
    </section>
  );
}
