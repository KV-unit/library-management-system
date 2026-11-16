import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Wrap a page in <ProtectedRoute> to require a login. Without a token the visitor is sent to
// /login, and the page they wanted is passed along in `state.from` so the login page can send
// them back there afterwards. With a token the children are rendered as normal.
//
// Pass role="LIBRARIAN" for an admin page: a logged-in user with a different role sees a
// "not allowed" message instead of the page.
//
// This only decides what the screen shows. The API still checks the token and the role on every
// request, because anyone can call the API directly and skip this component.
export default function ProtectedRoute({ children, role }) {
  const { token, user } = useAuth();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (role && (!user || user.role !== role)) {
    return (
      <section className="state state--error" role="alert">
        <h1>Not allowed</h1>
        <p>You do not have permission to open this page.</p>
        <Link to="/" className="button">
          Back to the catalog
        </Link>
      </section>
    );
  }
  return children;
}
