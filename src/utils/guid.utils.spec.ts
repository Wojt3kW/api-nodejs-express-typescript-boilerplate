import { Guid } from 'guid-typescript';
import { isGuid } from './guid.utils';

describe('isGuid', () => {
  it('should return false for null value', () => {
    expect(isGuid(null)).toBe(false);
  });

  it('should return false for undefined value', () => {
    expect(isGuid(undefined)).toBe(false);
  });

  it('should return false for non-string value', () => {
    expect(isGuid(123)).toBe(false);
    expect(isGuid({})).toBe(false);
    expect(isGuid([])).toBe(false);
    expect(isGuid([Guid.raw()])).toBe(false);
    expect(isGuid(() => {})).toBe(false);
    expect(
      isGuid(() => {
        return Guid.raw();
      }),
    ).toBe(false);
  });

  it('should return false for invalid GUID', () => {
    expect(isGuid('')).toBe(false);
    expect(isGuid(' ')).toBe(false);
    expect(isGuid('4880367593064f4cab697d01d82b301c')).toBe(false);
    expect(isGuid('XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX')).toBe(false);
    expect(isGuid('not-a-guid')).toBe(false);
  });

  it('should return true for valid GUID', () => {
    expect(isGuid('f47ac10b-58cc-4372-a567-0e02b2c3d479')).toBe(true);
  });
});
