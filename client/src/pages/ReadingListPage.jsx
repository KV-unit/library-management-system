import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useReadingList } from '../context/ReadingListContext';

// Shows the saved reading list. It works for guests too; the list is kept in localStorage.
export default function ReadingListPage() {
  const { items, removeBook, clearList } = useReadingList();
  const { isLoggedIn } = useAuth();

  return (
    <section>
      <h1>Your reading list</h1>
      {!isLoggedIn && (
        <p className="lead">
          This list is saved in this browser. <Link to="/login">Log in</Link> and it will be added to your account.
        </p>
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
          <button type="button" className="button button--ghost" onClick={clearList}>
            Clear list
          </button>
        </>
      )}
    </section>
  );
}
