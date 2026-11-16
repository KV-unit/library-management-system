import { calculateFine, daysLate } from './fine-calculator';

describe('calculateFine', () => {
  const due = new Date('2026-03-10T09:00:00.000Z');

  it('is 0 for a book returned before the due date', () => {
    expect(calculateFine(due, new Date('2026-03-07T12:00:00.000Z'), 0.5)).toBe(0);
  });

  it('is 0 for a book returned on the due date, even late in the day', () => {
    expect(calculateFine(due, new Date('2026-03-10T23:59:00.000Z'), 0.5)).toBe(0);
  });

  it('charges one day for a book returned one day late', () => {
    expect(calculateFine(due, new Date('2026-03-11T08:00:00.000Z'), 0.5)).toBe(0.5);
  });

  it('multiplies the days late by the daily rate', () => {
    expect(calculateFine(due, new Date('2026-03-15T10:00:00.000Z'), 0.5)).toBe(2.5);
    expect(calculateFine(due, new Date('2026-03-20T10:00:00.000Z'), 2)).toBe(20);
  });

  it('counts calendar days across a month boundary', () => {
    expect(calculateFine(new Date('2026-01-30T12:00:00.000Z'), new Date('2026-02-02T12:00:00.000Z'), 1)).toBe(3);
  });

  it('counts a return just after midnight as the next day', () => {
    expect(calculateFine(new Date('2026-03-10T23:59:00.000Z'), new Date('2026-03-11T00:01:00.000Z'), 1)).toBe(1);
  });

  it('rounds the result to the nearest cent', () => {
    expect(calculateFine(due, new Date('2026-03-13T10:00:00.000Z'), 0.333)).toBe(1);
    expect(calculateFine(due, new Date('2026-03-12T10:00:00.000Z'), 0.125)).toBe(0.25);
  });

  it('is 0 when the rate is 0', () => {
    expect(calculateFine(due, new Date('2026-04-10T10:00:00.000Z'), 0)).toBe(0);
  });

  it('does not change the dates it is given', () => {
    const returned = new Date('2026-03-15T10:00:00.000Z');
    calculateFine(due, returned, 0.5);
    expect(due.toISOString()).toBe('2026-03-10T09:00:00.000Z');
    expect(returned.toISOString()).toBe('2026-03-15T10:00:00.000Z');
  });

  it('rejects an invalid date or a negative rate', () => {
    expect(() => calculateFine(new Date('not a date'), due, 0.5)).toThrow(RangeError);
    expect(() => calculateFine(due, new Date('not a date'), 0.5)).toThrow(RangeError);
    expect(() => calculateFine(due, due, -1)).toThrow(RangeError);
    expect(() => calculateFine(due, due, Number.NaN)).toThrow(RangeError);
  });
});

describe('daysLate', () => {
  it('is never negative', () => {
    expect(daysLate(new Date('2026-03-10T00:00:00.000Z'), new Date('2026-03-01T00:00:00.000Z'))).toBe(0);
  });
});
