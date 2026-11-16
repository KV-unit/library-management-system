import { Link, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { ReadingListProvider } from './context/ReadingListContext';
import BookDetail from './pages/BookDetail';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ReadingListPage from './pages/ReadingListPage';
import RegisterPage from './pages/RegisterPage';
import SpaceBookingPage from './pages/SpaceBookingPage';

function NotFound() {
  return (
    <section className="state">
      <h1>Page not found</h1>
      <p>That address does not exist.</p>
      <Link to="/" className="button">
        Go to the catalog
      </Link>
    </section>
  );
}

// AuthProvider is outside ReadingListProvider because the reading list needs to know who is logged in
// (every account keeps its own list, and a guest's list is merged into it at login).
export default function App() {
  return (
    <AuthProvider>
      <ReadingListProvider>
        <Navbar />
        <main className="container">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/books/:id" element={<BookDetail />} />
            <Route path="/reading-list" element={<ReadingListPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/book-space"
              element={
                <ProtectedRoute>
                  <SpaceBookingPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </ReadingListProvider>
    </AuthProvider>
  );
}
