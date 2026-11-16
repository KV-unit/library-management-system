import { useEffect, useState } from 'react';

// A live search box. It waits until the visitor has stopped typing for `delay` ms
// before it calls onSearch, so typing "dune" sends one request instead of four.
export default function SearchBar({ onSearch, initialValue = '', delay = 400 }) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    // Start a timer on every change...
    const timer = setTimeout(() => {
      onSearch(value.trim());
    }, delay);

    // ...and cancel it if the value changes again (or the component goes away) before it fires.
    return () => clearTimeout(timer);
  }, [value, delay, onSearch]);

  return (
    <div className="search-bar">
      <label htmlFor="book-search" className="sr-only">
        Search by title or author
      </label>
      <input
        id="book-search"
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search by title or author"
        autoComplete="off"
      />
    </div>
  );
}
