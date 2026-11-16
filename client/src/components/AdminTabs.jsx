import { Link } from 'react-router-dom';

// The two admin pages, with the current one highlighted.
export default function AdminTabs({ current }) {
  return (
    <nav className="admin-tabs" aria-label="Admin">
      <Link to="/admin/borrow-requests" aria-current={current === 'borrow' ? 'page' : undefined}>
        Borrow requests
      </Link>
      <Link to="/admin/bookings" aria-current={current === 'bookings' ? 'page' : undefined}>
        Space bookings
      </Link>
    </nav>
  );
}
