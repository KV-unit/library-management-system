import { Link } from 'react-router-dom';
import StatusPill from '../components/StatusPill';
import { formatDate, formatMoney } from '../lib/format';
import { useApiData } from '../lib/useApiData';

// The logged-in user's own borrow requests: GET /borrow-requests/mine.
export default function MyRequestsPage() {
  const { status, data, error, reload } = useApiData('/borrow-requests/mine');

  return (
    <section>
      <h1>My borrow requests</h1>

      {status === 'loading' && (
        <p className="lead" role="status">
          Loading your requests...
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
          <h2>No requests yet</h2>
          <p>Add books to your reading list, then request to borrow them.</p>
          <Link to="/reading-list" className="button">
            Go to your reading list
          </Link>
        </div>
      )}

      {status === 'success' && data.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Book</th>
                <th>Status</th>
                <th>Requested</th>
                <th>Due</th>
                <th>Returned</th>
                <th className="num">Fine</th>
              </tr>
            </thead>
            <tbody>
              {data.map((request) => (
                <tr key={request.id}>
                  <td>
                    <Link to={`/books/${request.book.id}`}>{request.book.title}</Link>
                    <div className="muted">{request.book.author}</div>
                  </td>
                  <td>
                    <StatusPill status={request.status} />
                  </td>
                  <td>{formatDate(request.requestedAt)}</td>
                  <td>{formatDate(request.dueDate)}</td>
                  <td>{formatDate(request.returnedAt)}</td>
                  <td className="num">{request.fineAmount > 0 ? formatMoney(request.fineAmount) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
