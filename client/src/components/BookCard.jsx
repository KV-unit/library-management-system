import { Link } from 'react-router-dom';

// "Dune Messiah" -> "DM". Used as a stand-in for a cover image.
function initials(title) {
  return title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');
}

// Renders one book. BookGrid maps over the books and gives each card key={book.id}.
export default function BookCard({ book }) {
  const inStock = book.availableCopies > 0;

  return (
    <li className="book-card">
      <Link to={`/books/${book.id}`} className="book-card__link">
        <div className="book-card__cover" style={{ '--hue': (book.genreId * 67) % 360 }} aria-hidden="true">
          <span>{initials(book.title)}</span>
        </div>
        <h3 className="book-card__title">{book.title}</h3>
        <p className="book-card__author">{book.author}</p>
        <div className="book-card__meta">
          {book.genre && <span className="badge">{book.genre.name}</span>}
          <span className={inStock ? 'stock stock--in' : 'stock stock--out'}>
            {inStock ? `${book.availableCopies} available` : 'All copies out'}
          </span>
        </div>
      </Link>
    </li>
  );
}
