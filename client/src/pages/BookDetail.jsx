import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { API_URL, HttpError, friendlyMessage, readError } from '../lib/api';

// The page for one book at /books/:id. It reads the id from the URL with useParams()
// and fetches GET /books/:id.
export default function BookDetail() {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [status, setStatus] = useState('loading'); // 'loading' | 'error' | 'success'
  const [errorMessage, setErrorMessage] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');

    fetch(`${API_URL}/books/${id}`, { signal: controller.signal })
      .then(async (res) => {
        if (res.status === 404) throw new HttpError('We could not find that book.', 404);
        if (!res.ok) throw new HttpError(await readError(res), res.status);
        return res.json();
      })
      .then((data) => {
        setBook(data);
        setStatus('success');
      })
      .catch((error) => {
        if (error.name === 'AbortError') return;
        setErrorMessage(friendlyMessage(error));
        setStatus('error');
      });

    return () => controller.abort();
  }, [id, attempt]);

  return (
    <section>
      <Link to="/" className="back-link">
        &larr; Back to the catalog
      </Link>

      {status === 'loading' && (
        <div className="detail" role="status" aria-label="Loading book">
          <div className="skeleton skeleton--cover detail__cover" />
          <div className="detail__body">
            <div className="skeleton skeleton--title" />
            <div className="skeleton skeleton--line skeleton--short" />
            <div className="skeleton skeleton--line" />
            <div className="skeleton skeleton--line" />
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="state state--error" role="alert">
          <h2>Book unavailable</h2>
          <p>{errorMessage}</p>
          <button type="button" className="button" onClick={() => setAttempt((n) => n + 1)}>
            Try again
          </button>
        </div>
      )}

      {status === 'success' && book && (
        <article className="detail">
          <div className="detail__cover" style={{ '--hue': (book.genreId * 67) % 360 }} aria-hidden="true">
            <span>{book.title.slice(0, 1).toUpperCase()}</span>
          </div>
          <div className="detail__body">
            <h1>{book.title}</h1>
            <p className="detail__author">by {book.author}</p>
            {book.genre && <span className="badge">{book.genre.name}</span>}

            <p className="detail__description">{book.description || 'No description has been added for this book yet.'}</p>

            <dl className="facts">
              <div>
                <dt>ISBN</dt>
                <dd>{book.isbn}</dd>
              </div>
              {book.publishedYear && (
                <div>
                  <dt>Published</dt>
                  <dd>{book.publishedYear}</dd>
                </div>
              )}
              <div>
                <dt>Copies</dt>
                <dd>
                  {book.availableCopies} of {book.totalCopies} available
                </dd>
              </div>
            </dl>
          </div>
        </article>
      )}
    </section>
  );
}
