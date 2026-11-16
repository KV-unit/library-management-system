import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useReadingList } from '../context/ReadingListContext';
import { HttpError, apiRequest, friendlyMessage } from '../lib/api';

// Shows the saved reading list. It works for guests too; the list is kept in localStorage.
// A logged-in user can turn the list into borrow requests with POST /borrow-requests.
export default function ReadingListPage() {
  const { items, removeBook, clearList } = useReadingList();
  const { isLoggedIn, token, logout } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [requestedCount, setRequestedCount] = useState(0);

  async function requestToBorrow() {
    if (submitting || items.length === 0) return;
    setSubmitting(true);
    setError('');
    setRequestedCount(0);
    const sent = items.map((item) => item.id);
    try {
      const created = await apiRequest('/borrow-requests', { method: 'POST', token, body: { bookIds: sent } });
      // The books are now requested, so they leave the reading list.
      sent.forEach((id) => removeBook(id));
      setRequestedCount(created.length);
    } catch (err) {
      if (err instanceof HttpError && err.status === 401) {
        logout();
        return;
      }
      setError(friendlyMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section>
      <h1>Your reading list</h1>
      {!isLoggedIn && (
        <p className="lead">
          This list is saved in this browser. <Link to="/login">Log in</Link> and it will be added to your account.
        </p>
      )}

      {requestedCount > 0 && (
        <div className="notice" role="status">
          Requested {requestedCount} {requestedCount === 1 ? 'book' : 'books'}. A librarian will review {requestedCount === 1 ? 'it' : 'them'}.{' '}
          <Link to="/my-requests">See your requests</Link>
        </div>
      )}

      {items.length === 0 ? (
        <div className="state">
          <h2>Nothing here yet</h2>
          <p>Add books from the catalog and they will show up here.</p>
          <Link to="/" className="button">
            Browse the catalog
          </Link>
        </div>
      ) : (
        <>
          <ul className="list-rows">
            {items.map((item) => (
              <li key={item.id} className="list-row">
                <div>
                  <Link to={`/books/${item.id}`} className="list-row__title">
                    {item.title}
                  </Link>
                  <p className="list-row__author">
                    {item.author}
                    {item.genre ? ` - ${item.genre}` : ''}
                  </p>
                </div>
                <button type="button" className="button button--ghost button--small" onClick={() => removeBook(item.id)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <div className="list-actions">
            {isLoggedIn ? (
              <button type="button" className="button" disabled={submitting} onClick={requestToBorrow}>
                {submitting ? 'Sending...' : `Request to borrow (${items.length})`}
              </button>
            ) : (
              <Link to="/login" state={{ from: { pathname: '/reading-list' } }} className="button">
                Log in to request these books
              </Link>
            )}
            <button type="button" className="button button--ghost" onClick={clearList}>
              Clear list
            </button>
          </div>
        </>
      )}
    </section>
  );
}
