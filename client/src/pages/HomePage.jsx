import { useEffect, useState } from 'react';
import BookGrid from '../components/BookGrid';
import GenreFilter from '../components/GenreFilter';
import SearchBar from '../components/SearchBar';
import SortControl from '../components/SortControl';

const STORAGE_KEY = 'library-catalog-filters';
const DEFAULTS = { search: '', genreId: null, sortBy: 'title' };

// Restores the filters after the visitor opens a book and comes back.
function loadFilters() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY));
    if (saved) return { ...DEFAULTS, ...saved };
  } catch {
    // storage is unavailable or holds junk: use the defaults
  }
  return DEFAULTS;
}

// The catalog page. It owns the shared filter state and hands it to the pieces that need it:
// SearchBar and GenreFilter change it, BookGrid reads it and fetches the matching books.
export default function HomePage() {
  const [search, setSearch] = useState(() => loadFilters().search);
  const [genreId, setGenreId] = useState(() => loadFilters().genreId);
  const [sortBy, setSortBy] = useState(() => loadFilters().sortBy);
  const [searchBoxKey, setSearchBoxKey] = useState(0); // changing it resets the search box text

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ search, genreId, sortBy }));
    } catch {
      // not being able to remember the filters is fine
    }
  }, [search, genreId, sortBy]);

  function clearFilters() {
    setSearch('');
    setGenreId(null);
    setSearchBoxKey((key) => key + 1);
  }

  return (
    <section>
      <h1>Library catalog</h1>
      <p className="lead">Search by title or author, or narrow the list to one genre.</p>

      <div className="toolbar">
        <SearchBar key={searchBoxKey} initialValue={search} onSearch={setSearch} />
        <GenreFilter value={genreId} onChange={setGenreId} />
        <SortControl value={sortBy} onChange={setSortBy} />
      </div>

      <BookGrid genreId={genreId} search={search} sortBy={sortBy} onClearFilters={clearFilters} />
    </section>
  );
}
