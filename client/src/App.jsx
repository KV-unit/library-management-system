import { Link, Route, Routes } from 'react-router-dom';
import BookDetail from './pages/BookDetail';
import HomePage from './pages/HomePage';

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

export default function App() {
  return (
    <>
      <header className="site-header">
        <Link to="/" className="site-title">
          Library Catalog
        </Link>
      </header>
      <main className="container">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/books/:id" element={<BookDetail />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </>
  );
}
