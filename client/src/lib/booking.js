// The spaces a patron can book. The dropdown on the booking page is built from this list.
export const SPACES = [
  { id: 1, name: 'Study Room A', capacity: 4 },
  { id: 2, name: 'Study Room B', capacity: 6 },
  { id: 3, name: 'Quiet Reading Hall', capacity: 20 },
  { id: 4, name: 'Computer Lab', capacity: 12 },
  { id: 5, name: 'Group Meeting Room', capacity: 10 },
];

const pad = (n) => String(n).padStart(2, '0');

// Today's date in the visitor's own time zone as YYYY-MM-DD (toISOString would use UTC).
export function todayString(now = new Date()) {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

// Right now as HH:MM, in the visitor's own time zone.
export function timeString(now = new Date()) {
  return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

// Checks the booking form. Returns an object with one message per field that is wrong, or an
// empty object when everything is fine. "HH:MM" strings compare correctly as plain text.
export function validateBooking(values, now = new Date()) {
  const errors = {};
  if (!values.spaceId) errors.spaceId = 'Choose a space.';
  if (!values.date) {
    errors.date = 'Choose a date.';
  } else if (values.date < todayString(now)) {
    errors.date = 'That date has already passed.';
  }
  if (!values.startTime) errors.startTime = 'Choose a start time.';
  if (!values.endTime) errors.endTime = 'Choose an end time.';
  if (values.startTime && values.endTime && values.endTime <= values.startTime) {
    errors.endTime = 'The end time must be after the start time.';
  }
  if (!errors.date && !errors.startTime && values.date === todayString(now) && values.startTime < timeString(now)) {
    errors.startTime = 'That start time has already passed.';
  }
  return errors;
}
