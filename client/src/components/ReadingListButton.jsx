import { useReadingList } from '../context/ReadingListContext';

// Adds the book to the reading list, or removes it if it is already there.
export default function ReadingListButton({ book }) {
  const { hasBook, addBook, removeBook } = useReadingList();
  const inList = hasBook(book.id);

  return (
    <button
      type="button"
      className={inList ? 'button button--ghost list-button' : 'button list-button'}
      aria-pressed={inList}
      onClick={() => (inList ? removeBook(book.id) : addBook(book))}
    >
      {inList ? 'Remove from reading list' : 'Add to reading list'}
    </button>
  );
}
