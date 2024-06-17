/* eslint-disable no-new-wrappers */
import { isNullOrEmptyString, isString } from './strings.utils';

describe('isNullOrEmptyString', () => {
  it('should return true for empty string', () => {
    expect(isNullOrEmptyString('')).toBe(true);
    expect(isNullOrEmptyString(' ')).toBe(true);
    expect(isNullOrEmptyString('\n')).toBe(true);
    expect(isNullOrEmptyString('\r')).toBe(true);
    expect(isNullOrEmptyString('\t')).toBe(true);
  });

  it('should return false for non-empty string', () => {
    expect(isNullOrEmptyString('Hello, world!')).toBe(false);
    expect(isNullOrEmptyString(' Hello, world!')).toBe(false);
    expect(isNullOrEmptyString(' Hello, world! ')).toBe(false);
    expect(isNullOrEmptyString('Hello, world! ')).toBe(false);
  });

  it('should return true for null value', () => {
    expect(isNullOrEmptyString(null)).toBe(true);
  });

  it('should return true for undefined value', () => {
    expect(isNullOrEmptyString(undefined)).toBe(true);
  });

  it('should return false for non-string value', () => {
    expect(isNullOrEmptyString(123)).toBe(false);
    expect(isNullOrEmptyString(new Date())).toBe(false);
    expect(isNullOrEmptyString(new String())).toBe(false);
    expect(isNullOrEmptyString(new Number())).toBe(false);
    expect(isNullOrEmptyString(new Number(1))).toBe(false);
    expect(isNullOrEmptyString(new Number(-1))).toBe(false);
    expect(isNullOrEmptyString({})).toBe(false);
    expect(isNullOrEmptyString([])).toBe(false);
    expect(isNullOrEmptyString(() => {})).toBe(false);
    expect(
      isNullOrEmptyString(() => {
        return 'hello, world!';
      }),
    ).toBe(false);
    expect(isNullOrEmptyString(function () {})).toBe(false);
    expect(
      isNullOrEmptyString(function () {
        return 'hello, world!';
      }),
    ).toBe(false);
  });
});

describe('isString', () => {
  it('should return true for string value', () => {
    expect(isString('Hello, world!')).toBe(true);
    expect(isString('')).toBe(true);
    expect(isString(' ')).toBe(true);
    expect(isString('\n')).toBe(true);
    expect(isString('\r')).toBe(true);
    expect(isString('\t')).toBe(true);
  });

  it('should return false for non-string value', () => {
    expect(isString(null)).toBe(false);
    expect(isString(undefined)).toBe(false);
    expect(isString(123)).toBe(false);
    expect(isString(new Date())).toBe(false);
    expect(isString(new String())).toBe(false);
    expect(isString(new Number())).toBe(false);
    expect(isString(new Number(1))).toBe(false);
    expect(isString(new Number(-1))).toBe(false);
    expect(isString({})).toBe(false);
    expect(isString([])).toBe(false);
    expect(isString(() => {})).toBe(false);
    expect(
      isString(() => {
        return 'hello, world!';
      }),
    ).toBe(false);
    expect(isString(function () {})).toBe(false);
    expect(
      isString(function () {
        return 'hello, world!';
      }),
    ).toBe(false);
  });
});
