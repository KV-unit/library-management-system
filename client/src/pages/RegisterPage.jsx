import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest, friendlyMessage } from '../lib/api';

// A controlled form that posts to POST /auth/register. That route returns the new user but no
// token, so right after registering we log in with the same details to get the JWT.
export default function RegisterPage() {
  const { login, isLoggedIn } = useAuth();
  const location = useLocation();
  const from = location.state && location.state.from ? location.state.from.pathname : '/';

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (isLoggedIn) return <Navigate to={from} replace />;

  // One handler for every input: the input's name says which piece of state to change.
  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function validate() {
    const found = {};
    if (!form.email.trim()) found.email = 'Enter your email.';
    else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) found.email = 'Enter a valid email address.';
    if (form.password.length < 8) found.password = 'Use at least 8 characters.';
    else if (form.password.length > 72) found.password = 'Use at most 72 characters.';
    if (form.confirm !== form.password) found.confirm = 'The passwords do not match.';
    return found;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    const found = validate();
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    const email = form.email.trim();
    try {
      const body = { email, password: form.password };
      if (form.name.trim()) body.name = form.name.trim();
      await apiRequest('/auth/register', { method: 'POST', body });
    } catch (err) {
      setFormError(friendlyMessage(err));
      setSubmitting(false);
      return;
    }

    try {
      const data = await apiRequest('/auth/login', { method: 'POST', body: { email, password: form.password } });
      login(data);
    } catch (err) {
      setFormError(`Your account was created, but logging in failed: ${friendlyMessage(err)} Try the Log in page.`);
      setSubmitting(false);
    }
  }

  return (
    <section className="form-card">
      <h1>Create an account</h1>

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-field">
          <label htmlFor="register-name">Name (optional)</label>
          <input id="register-name" name="name" type="text" autoComplete="name" value={form.name} onChange={handleChange} />
        </div>
        <div className="form-field">
          <label htmlFor="register-email">Email</label>
          <input
            id="register-email"
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            aria-invalid={Boolean(errors.email)}
          />
          {errors.email && <p className="field-error">{errors.email}</p>}
        </div>
        <div className="form-field">
          <label htmlFor="register-password">Password</label>
          <input
            id="register-password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={handleChange}
            aria-invalid={Boolean(errors.password)}
          />
          {errors.password ? <p className="field-error">{errors.password}</p> : <p className="field__hint">At least 8 characters.</p>}
        </div>
        <div className="form-field">
          <label htmlFor="register-confirm">Confirm password</label>
          <input
            id="register-confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            value={form.confirm}
            onChange={handleChange}
            aria-invalid={Boolean(errors.confirm)}
          />
          {errors.confirm && <p className="field-error">{errors.confirm}</p>}
        </div>

        {formError && (
          <p className="form-error" role="alert">
            {formError}
          </p>
        )}

        <button type="submit" className="button" disabled={submitting}>
          {submitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className="form-footer">
        Already have an account? <Link to="/login" state={location.state}>Log in</Link>
      </p>
    </section>
  );
}
