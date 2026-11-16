import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useReadingList } from '../context/ReadingListContext';

// The bar at the top of every page. The count next to "Reading list" comes from
// ReadingListContext, so it updates the moment a book is added or removed anywhere.
export default function Navbar() {
  const { count } = useReadingList();
  const { user, isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <header className="site-header">
      <div className="navbar">
        <Link to="/" className="navbar__brand">
          Library Catalog
        </Link>
        <nav className="navbar__links" aria-label="Main">
          <Link to="/">Catalog</Link>
          <Link to="/reading-list">
            Reading list{' '}
            <span className="count-badge" data-testid="reading-list-count" aria-label={`${count} books in your reading list`}>
              {count}
            </span>
          </Link>
          <Link to="/book-space">Book a space</Link>
          {isLoggedIn ? (
            <>
              <span className="navbar__user">{user.name || user.email}</span>
              <button type="button" className="button button--ghost button--small" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Log in</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
