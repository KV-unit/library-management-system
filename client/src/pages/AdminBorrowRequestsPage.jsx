import { useState } from 'react';
import AdminTabs from '../components/AdminTabs';
import StatusPill from '../components/StatusPill';
import { useAuth } from '../context/AuthContext';
import { apiRequest, friendlyMessage } from '../lib/api';
import { BORROW_LABELS, formatDate, formatMoney } from '../lib/format';
import { useApiData } from '../lib/useApiData';

// What a librarian can do to a request in each status.
const ACTIONS = {
  PENDING: [
    { status: 'APPROVED', label: 'Approve' },
    { status: 'REJECTED', label: 'Reject' },
  ],
  APPROVED: [{ status: 'RETURNED', label: 'Mark returned' }],
};

// Admin page (librarians only): list every borrow request and move it forward with PATCH /borrow-requests/:id.
export default function AdminBorrowRequestsPage() {
  const { token } = useAuth();
  const [filter, setFilter] = useState('PENDING');
  const { status, data, error, reload, replaceItem } = useApiData(filter ? `/borrow-requests?status=${filter}` : '/borrow-requests');
  const [busyId, setBusyId] = useState(null);
  const [rowErrors, setRowErrors] = useState({});

  async function change(request, nextStatus) {
    setBusyId(request.id);
    setRowErrors((current) => ({ ...current, [request.id]: '' }));
    try {
      const updated = await apiRequest(`/borrow-requests/${request.id}`, { method: 'PATCH', token, body: { status: nextStatus } });
      replaceItem(updated);
    } catch (err) {
      setRowErrors((current) => ({ ...current, [request.id]: friendlyMessage(err) }));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section>
      <h1>Admin</h1>
      <AdminTabs current="borrow" />

      <div className="toolbar-inline">
        <label htmlFor="status-filter">Show</label>
        <select id="status-filter" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All requests</option>
          {Object.entries(BORROW_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {status === 'loading' && (
        <p className="lead" role="status">
          Loading requests...
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
          <h2>No requests here</h2>
          <p>Nothing matches this filter.</p>
        </div>
      )}

      {status === 'success' && data.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Patron</th>
                <th>Book</th>
                <th>Status</th>
                <th>Requested</th>
                <th>Due</th>
                <th className="num">Fine</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.map((request) => (
                <tr key={request.id}>
                  <td>
                    {request.user.name || request.user.email}
                    {request.user.name && <div className="muted">{request.user.email}</div>}
                  </td>
                  <td>
                    {request.book.title}
                    <div className="muted">{request.book.author}</div>
                  </td>
                  <td>
                    <StatusPill status={request.status} />
                  </td>
                  <td>{formatDate(request.requestedAt)}</td>
                  <td>{formatDate(request.dueDate)}</td>
                  <td className="num">{request.status === 'RETURNED' ? formatMoney(request.fineAmount) : '-'}</td>
                  <td>
                    <div className="row-actions">
                      {(ACTIONS[request.status] || []).map((action) => (
                        <button
                          key={action.status}
                          type="button"
                          className="button button--small"
                          disabled={busyId === request.id}
                          onClick={() => change(request, action.status)}
                        >
                          {action.label}
                        </button>
                      ))}
                      {!ACTIONS[request.status] && <span className="muted">Done</span>}
                    </div>
                    {rowErrors[request.id] && (
                      <p className="field-error" role="alert">
                        {rowErrors[request.id]}
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
