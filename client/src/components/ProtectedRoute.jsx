import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Wrap a page in <ProtectedRoute> to require a login. Without a token the visitor is sent to
// /login, and the page they wanted is passed along in `state.from` so the login page can send
// them back there afterwards. With a token the children are rendered as normal.
//
// This only decides what the screen shows. The API still checks the token on every request,
// because anyone can call the API directly and skip this component.
export default function ProtectedRoute({ children }) {
  const { token } = useAuth();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}
