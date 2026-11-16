import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { HttpError, apiRequest, friendlyMessage } from '../lib/api';
import { todayString, validateBooking } from '../lib/booking';

const EMPTY = { spaceId: '', date: '', startTime: '', endTime: '' };

// A controlled form with a space dropdown and native date and time inputs. The browser provides the
// pickers, so no extra library is needed. The spaces come from GET /spaces. It sits behind
// <ProtectedRoute>, so a token always exists.
export default function SpaceBookingPage() {
  const { token, user, logout } = useAuth();
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(null);
  const [spaces, setSpaces] = useState([]);
  const [spacesStatus, setSpacesStatus] = useState('loading'); // 'loading' | 'error' | 'ready'
  const [attempt, setAttempt] = useState(0);

  // Load the bookable spaces once (and again when "Try again" is pressed).
  useEffect(() => {
    const controller = new AbortController();
    setSpacesStatus('loading');
    apiRequest('/spaces', { signal: controller.signal })
      .then((list) => {
        setSpaces(list);
        setSpacesStatus('ready');
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setSpacesStatus('error');
      });
    return () => controller.abort();
  }, [attempt]);

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    const found = validateBooking(values);
    setErrors(found);
    setSubmitError('');
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      await apiRequest('/bookings', {
        method: 'POST',
        token,
        body: { spaceId: Number(values.spaceId), date: values.date, startTime: values.startTime, endTime: values.endTime },
      });
      setConfirmed(values);
      setValues(EMPTY);
    } catch (err) {
      if (err instanceof HttpError && err.status === 401) {
        logout(); // the token is no longer valid, so ProtectedRoute sends the visitor to /login
        return;
      }
      if (err instanceof HttpError && err.status === 409) {
        setSubmitError('That space is already booked at that time. Pick another time or space.');
      } else if (err instanceof HttpError && err.status === 404 && err.message.startsWith('Cannot ')) {
        // Nest's own "Cannot POST /bookings" means this server has no booking route at all.
        setSubmitError('The booking service is not available on this server yet.');
      } else {
        setSubmitError(friendlyMessage(err));
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmed) {
    const space = spaces.find((s) => String(s.id) === confirmed.spaceId);
    return (
      <section className="form-card">
        <div className="state" role="status">
          <h1>Booking requested</h1>
          <p>
            {space ? space.name : 'Your space'} on {confirmed.date}, {confirmed.startTime} to {confirmed.endTime}.
          </p>
          <button type="button" className="button" onClick={() => setConfirmed(null)}>
            Book another space
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="form-card">
      <h1>Book a space</h1>
      <p className="lead">Signed in as {user.name || user.email}.</p>

      {spacesStatus === 'loading' && (
        <p role="status" className="lead">
          Loading spaces...
        </p>
      )}
      {spacesStatus === 'error' && (
        <div className="state state--error" role="alert">
          <h2>Spaces unavailable</h2>
          <p>Could not load the list of spaces. Check that the API is running.</p>
          <button type="button" className="button" onClick={() => setAttempt((n) => n + 1)}>
            Try again
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate hidden={spacesStatus !== 'ready'}>
        <div className="form-field">
          <label htmlFor="booking-space">Space</label>
          <select id="booking-space" name="spaceId" value={values.spaceId} onChange={handleChange} aria-invalid={Boolean(errors.spaceId)}>
            <option value="">Choose a space</option>
            {spaces.map((space) => (
              <option key={space.id} value={space.id}>
                {space.name} (up to {space.capacity})
              </option>
            ))}
          </select>
          {errors.spaceId && <p className="field-error">{errors.spaceId}</p>}
        </div>

        <div className="form-field">
          <label htmlFor="booking-date">Date</label>
          <input
            id="booking-date"
            name="date"
            type="date"
            min={todayString()}
            value={values.date}
            onChange={handleChange}
            aria-invalid={Boolean(errors.date)}
          />
          {errors.date && <p className="field-error">{errors.date}</p>}
        </div>

        <div className="form-row">
          <div className="form-field">
            <label htmlFor="booking-start">Start time</label>
            <input
              id="booking-start"
              name="startTime"
              type="time"
              value={values.startTime}
              onChange={handleChange}
              aria-invalid={Boolean(errors.startTime)}
            />
            {errors.startTime && <p className="field-error">{errors.startTime}</p>}
          </div>
          <div className="form-field">
            <label htmlFor="booking-end">End time</label>
            <input
              id="booking-end"
              name="endTime"
              type="time"
              value={values.endTime}
              onChange={handleChange}
              aria-invalid={Boolean(errors.endTime)}
            />
            {errors.endTime && <p className="field-error">{errors.endTime}</p>}
          </div>
        </div>

        {submitError && (
          <p className="form-error" role="alert">
            {submitError}
          </p>
        )}

        <button type="submit" className="button" disabled={submitting}>
          {submitting ? 'Sending...' : 'Request booking'}
        </button>
      </form>
    </section>
  );
}
