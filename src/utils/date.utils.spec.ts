import { getUtcNow, isDate, toUtcDate } from './date.utils';

describe('toUtcDate', () => {
  it('should return null for null value', () => {
    expect(toUtcDate(null)).toBe(null);
  });

  it('should return null for undefined value', () => {
    expect(toUtcDate(undefined)).toBe(null);
  });

  it('should return null for non-date value', () => {
    expect(toUtcDate('2022-01-01')).toBe(null);
    expect(toUtcDate(123)).toBe(null);
    expect(toUtcDate({})).toBe(null);
    expect(toUtcDate([])).toBe(null);
    expect(toUtcDate(() => {})).toBe(null);
  });

  it('should return UTC date for valid date', () => {
    const date = new Date('2022-01-01');
    const utcDate = toUtcDate(date);
    expect(utcDate).toEqual(new Date(Date.UTC(2022, 0, 1, 0, 0, 0, 0)));
  });
});

describe('isDate', () => {
  it('should return false for null value', () => {
    expect(isDate(null)).toBe(false);
  });

  it('should return false for undefined value', () => {
    expect(isDate(undefined)).toBe(false);
  });

  it('should return false for non-date value', () => {
    expect(isDate('2022-01-01')).toBe(false);
    expect(isDate(123)).toBe(false);
    expect(isDate({})).toBe(false);
    expect(isDate([])).toBe(false);
    expect(isDate(() => {})).toBe(false);
  });

  it('should return true for valid date', () => {
    const date = new Date('2022-01-01');
    expect(isDate(date)).toBe(true);
  });
});

describe('getUtcNow', () => {
  it('should return current UTC date', () => {
    const now = new Date();
    const utcNow = getUtcNow();
    expect(utcNow).toEqual(new Date(Date.UTC(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      now.getHours(),
      now.getMinutes(),
      now.getSeconds()
    )));
  });
});
