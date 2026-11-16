import { BORROW_LABELS } from '../lib/format';

// A small coloured label for a borrow or booking status.
export default function StatusPill({ status }) {
  const label = BORROW_LABELS[status] || (status ? status.charAt(0) + status.slice(1).toLowerCase() : '');
  return <span className={`pill pill--${String(status).toLowerCase()}`}>{label}</span>;
}
