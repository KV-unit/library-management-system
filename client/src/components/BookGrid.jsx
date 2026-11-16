import { useEffect, useMemo, useState } from 'react';
import { API_URL, HttpError, friendlyMessage, readError } from '../lib/api';
import { sortBooks } from '../lib/sort';
import BookCard from './BookCard';
import SkeletonCard from './SkeletonCard';

// Fetches GET /books for the current filters and shows one of four things:
// a loading skeleton, an error with a retry button, an empty message, or the grid of cards.
export default function BookGrid({ genreId, search, sortBy, onClearFilters }) {
  const [books, setBooks] = useState([]);
  const [status, setStatus] = useState('loading'); // 'loading' | 'error' | 'success'
  const [errorMessage, setErrorMessage] = useState('');
  const [attempt, setAttempt] = useState(0); // bumped by the Retry button

  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');

    // GET /books?genreId=2&search=dune (limit 100 is the most the API allows per page)
    const params = new URLSearchParams();
    if (genreId) params.set('genreId', genreId);
    if (search) params.set('search', search);
    params.set('limit', '100');

    fetch(`${API_URL}/books?${params}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new HttpError(await readError(res), res.status);
        return res.json();
      })
      .then((body) => {
        setBooks(body.data);
        setStatus('success');
      })
      .catch((error) => {
        if (error.name === 'AbortError') return; // a newer request replaced this one
        setErrorMessage(friendlyMessage(error));
        setStatus('error');
      });

    // If the filters change before the answer arrives, drop the old request so it cannot overwrite the new one.
    return () => controller.abort();
  }, [genreId, search, attempt]);

  const sortedBooks = useMemo(() => sortBooks(books, sortBy), [books, sortBy]);

  if (status === 'loading') {
    return (
      <div role="status" aria-label="Loading books">
        <ul className="book-grid">
          {Array.from({ length: 8 }, (_, index) => (
            <SkeletonCard key={index} />
          ))}
        </ul>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="state state--error" role="alert">
        <h2>Something went wrong</h2>
        <p>{errorMessage}</p>
        <button type="button" className="button" onClick={() => setAttempt((n) => n + 1)}>
          Try again
        </button>
      </div>
    );
  }

  if (sortedBooks.length === 0) {
    const filtered = Boolean(genreId || search);
    return (
      <div className="state">
        <h2>No books found</h2>
        <p>{filtered ? 'Nothing matches your search and genre. Try different words or clear the filters.' : 'The catalog is empty.'}</p>
        {filtered && (
          <button type="button" className="button" onClick={onClearFilters}>
            Clear filters
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <p className="result-count" aria-live="polite">
        {sortedBooks.length} {sortedBooks.length === 1 ? 'book' : 'books'}
      </p>
      <ul className="book-grid">
        {sortedBooks.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </ul>
    </>
  );
}
