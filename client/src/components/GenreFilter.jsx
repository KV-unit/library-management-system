import { useEffect, useState } from 'react';
import { API_URL } from '../lib/api';

// A dropdown of genres. The selected genre id is held by HomePage (value / onChange).
export default function GenreFilter({ value, onChange }) {
  const [genres, setGenres] = useState([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${API_URL}/genres`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('genres failed');
        return res.json();
      })
      .then((data) => setGenres(data))
      .catch((error) => {
        if (error.name !== 'AbortError') setFailed(true);
      });

    return () => controller.abort();
  }, []);

  return (
    <div className="field">
      <label htmlFor="genre-filter" className="sr-only">
        Filter by genre
      </label>
      <select
        id="genre-filter"
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null)}
      >
        <option value="">All genres</option>
        {genres.map((genre) => (
          <option key={genre.id} value={genre.id}>
            {genre.name} ({genre._count?.books ?? 0})
          </option>
        ))}
      </select>
      {failed && <span className="field__hint">Genres could not be loaded</span>}
    </div>
  );
}
