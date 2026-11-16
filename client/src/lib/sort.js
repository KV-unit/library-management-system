// Sorts a copy of the books by 'title' or 'author' (A to Z, ignoring case and accents).
// Ties are broken by title so the order is always stable.
export function sortBooks(books, sortBy) {
  const key = sortBy === 'author' ? 'author' : 'title';
  const compare = (a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' });
  return [...books].sort((x, y) => compare(x[key], y[key]) || compare(x.title, y.title));
}
