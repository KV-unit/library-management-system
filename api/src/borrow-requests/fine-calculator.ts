const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Midnight (UTC) at the start of the day a date falls on, as a number of milliseconds.
function startOfDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

// How many whole calendar days after the due date the book came back. Returning on the due date,
// at any time of day, is on time. Returning early is also on time, so the answer is never negative.
export function daysLate(dueDate: Date, returnDate: Date): number {
  const days = Math.round((startOfDay(returnDate) - startOfDay(dueDate)) / MS_PER_DAY);
  return Math.max(0, days);
}

// The fine for a late return: days late multiplied by the daily rate, rounded to the nearest cent.
// A pure function: the same inputs always give the same answer, and it touches no database.
export function calculateFine(dueDate: Date, returnDate: Date, ratePerDay: number): number {
  if (Number.isNaN(dueDate.getTime()) || Number.isNaN(returnDate.getTime())) {
    throw new RangeError('dueDate and returnDate must be valid dates');
  }
  if (!Number.isFinite(ratePerDay) || ratePerDay < 0) {
    throw new RangeError('ratePerDay must be a number that is zero or more');
  }
  return Math.round(daysLate(dueDate, returnDate) * ratePerDay * 100) / 100;
}
