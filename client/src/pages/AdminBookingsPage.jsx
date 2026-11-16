import { useEffect, useState } from 'react';
import AdminTabs from '../components/AdminTabs';
import StatusPill from '../components/StatusPill';
import { useAuth } from '../context/AuthContext';
import { apiRequest, friendlyMessage } from '../lib/api';
import { useApiData } from '../lib/useApiData';

// Admin page (librarians only): every space booking from GET /bookings/all, filtered by space and day.
export default function AdminBookingsPage() {
  const { token } = useAuth();
  const [spaces, setSpaces] = useState([]);
  const [spaceId, setSpaceId] = useState('');
  const [date, setDate] = useState('');

  const params = new URLSearchParams();
  if (spaceId) params.set('spaceId', spaceId);
  if (date) params.set('date', date);
  const query = params.toString();
  const { status, data, error, reload, replaceItem } = useApiData(query ? `/bookings/all?${query}` : '/bookings/all');

  const [busyId, setBusyId] = useState(null);
  const [rowErrors, setRowErrors] = useState({});

  // The space filter's options come from GET /spaces.
  useEffect(() => {
    apiRequest('/spaces')
      .then(setSpaces)
      .catch(() => setSpaces([]));
  }, []);

  async function cancel(booking) {
    setBusyId(booking.id);
    setRowErrors((current) => ({ ...current, [booking.id]: '' }));
    try {
      const updated = await apiRequest(`/bookings/${booking.id}`, { method: 'DELETE', token });
      replaceItem({ id: booking.id, status: updated.status });
    } catch (err) {
      setRowErrors((current) => ({ ...current, [booking.id]: friendlyMessage(err) }));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section>
      <h1>Admin</h1>
      <AdminTabs current="bookings" />

      <div className="toolbar-inline">
        <label htmlFor="space-filter">Space</label>
        <select id="space-filter" value={spaceId} onChange={(e) => setSpaceId(e.target.value)}>
          <option value="">All spaces</option>
          {spaces.map((space) => (
            <option key={space.id} value={space.id}>
              {space.name}
            </option>
          ))}
        </select>
        <label htmlFor="date-filter">Day</label>
        <input id="date-filter" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        {date && (
          <button type="button" className="button button--ghost button--small" onClick={() => setDate('')}>
            Clear day
          </button>
        )}
      </div>

      {status === 'loading' && (
        <p className="lead" role="status">
          Loading bookings...
        </p>
      )}

      {status === 'error' && (
        <div className="state state--error" role="alert">
          <h2>Something went wrong</h2>
          <p>{error}</p>
          <button type="button" className="button" onClick={reload}>
            Try again
          </button>
        </div>
      )}

      {status === 'success' && data.length === 0 && (
        <div className="state">
          <h2>No bookings</h2>
          <p>Nothing matches these filters.</p>
        </div>
      )}

      {status === 'success' && data.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Space</th>
                <th>Booked by</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.map((booking) => (
                <tr key={booking.id}>
                  <td>{booking.date}</td>
                  <td>
                    {booking.startTime} to {booking.endTime}
                  </td>
                  <td>{booking.space.name}</td>
                  <td>{booking.user ? booking.user.name || booking.user.email : '-'}</td>
                  <td>
                    <StatusPill status={booking.status} />
                  </td>
                  <td>
                    {booking.status === 'CONFIRMED' ? (
                      <button type="button" className="button button--ghost button--small" disabled={busyId === booking.id} onClick={() => cancel(booking)}>
                        Cancel booking
                      </button>
                    ) : (
                      <span className="muted">-</span>
                    )}
                    {rowErrors[booking.id] && (
                      <p className="field-error" role="alert">
                        {rowErrors[booking.id]}
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
