// Small display helpers shared by the request and booking pages.

// "2026-11-20T10:00:00.000Z" -> "20 Nov 2026". Returns a dash for a missing date.
export function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// 2.5 -> "2.50"
export function formatMoney(amount) {
  return Number(amount || 0).toFixed(2);
}

export const BORROW_LABELS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  RETURNED: 'Returned',
};
