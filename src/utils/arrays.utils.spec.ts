import { arraysEquals, isArray } from './arrays.utils';

describe('arrays.utils', () => {
  describe('arrayEquals', () => {
    it('Check if arrays are equal', () => {
      expect(arraysEquals(null, null)).toBe(true);
      expect(arraysEquals(null, [])).toBe(true);
      expect(arraysEquals([], null)).toBe(true);
      expect(arraysEquals([], [])).toBe(true);
      expect(arraysEquals([1], [1])).toBe(true);
      expect(arraysEquals([1, 2], [2, 1])).toBe(true);
      expect(arraysEquals(['a'], ['a'])).toBe(true);
      expect(arraysEquals(['a', 'b'], ['b', 'a'])).toBe(true);
      expect(arraysEquals([''], [''])).toBe(true);
      expect(arraysEquals([0], [0])).toBe(true);
      expect(arraysEquals([[]], [[]])).toBe(true);
      expect(arraysEquals([null], [null])).toBe(true);
      expect(arraysEquals([{}], [{}])).toBe(true);
      expect(arraysEquals([{ a: 1 }], [{ a: 1 }])).toBe(true);
      expect(arraysEquals([{ a: 1, b: {} }], [{ a: 1, b: {} }])).toBe(true);
      expect(arraysEquals([function () {}], [function () {}])).toBe(true);
      expect(
        arraysEquals(
          [
            function () {
              return 1;
            }
          ],
          [
            function () {
              return 1;
            }
          ]
        )
      ).toBe(true);
      expect(
        arraysEquals(
          [
            () => {
              return 1;
            }
          ],
          [
            () => {
              return 1;
            }
          ]
        )
      ).toBe(true);
    });
    it('Check if arrays are NOT equal', () => {
      expect(arraysEquals(null, [1])).toBe(false);
      expect(arraysEquals(null, [0])).toBe(false);
      expect(arraysEquals(null, ['a'])).toBe(false);
      expect(arraysEquals(null, [false])).toBe(false);
      expect(arraysEquals([], [1])).toBe(false);
      expect(arraysEquals([], [[]])).toBe(false);
      expect(arraysEquals([], [0])).toBe(false);
      expect(arraysEquals([], ['a'])).toBe(false);
      expect(arraysEquals([1], null)).toBe(false);
      expect(arraysEquals([1], [])).toBe(false);
      expect(arraysEquals([false], null)).toBe(false);
      expect(arraysEquals([false], [])).toBe(false);
      expect(arraysEquals([false], [0])).toBe(false);
      expect(arraysEquals([false], [''])).toBe(false);
      expect(arraysEquals([1], [0])).toBe(false);
      expect(arraysEquals(['0'], [0])).toBe(false);
      expect(arraysEquals(['a'], ['b', 'a'])).toBe(false);
      expect(arraysEquals(['b', 'a'], ['a'])).toBe(false);
      expect(arraysEquals(null, [{}])).toBe(false);
      expect(arraysEquals([], [{}])).toBe(false);
      expect(arraysEquals([null], [{}])).toBe(false);
      expect(arraysEquals([[]], [{}])).toBe(false);
      expect(arraysEquals([{ a: 1 }], [{}])).toBe(false);
      expect(arraysEquals([{ a: 1, b: {} }], [{ a: 1 }])).toBe(false);
      expect(arraysEquals([{ a: 1, b: {} }], [{ a: 1, b: 2 }])).toBe(false);
      expect(arraysEquals([{ a: 1, b: {} }], [{ a: 1, b: undefined }])).toBe(false);
      expect(arraysEquals([{ a: 1, b: {} }], [{ a: 1, b: null }])).toBe(false);
      expect(arraysEquals([{ a: 1, b: {} }], [{ a: 1, b: { c: 2 } }])).toBe(false);
      expect(arraysEquals([function (a: any) {}], [function (b: any) {}])).toBe(false);
      expect(
        arraysEquals(
          [
            function () {
              return 1;
            }
          ],
          [function () {}]
        )
      ).toBe(false);
      expect(
        arraysEquals(
          [
            function () {
              return 1;
            }
          ],
          [
            function () {
              return 2;
            }
          ]
        )
      ).toBe(false);
      expect(
        arraysEquals(
          [
            function () {
              return 1;
            }
          ],
          [
            () => {
              return 1;
            }
          ]
        )
      ).toBe(false);
      expect(
        arraysEquals(
          [
            function () {
              const x = 1;
              return x;
            }
          ],
          [
            function () {
              return 1;
            }
          ]
        )
      ).toBe(false);
    });
  });

  describe('isArray', () => {
    it('should return true for valid arrays', () => {
      expect(isArray([])).toBe(true);
      expect(isArray([1, 2, 3])).toBe(true);
      expect(isArray(['a', 'b', 'c'])).toBe(true);
      expect(isArray([null, undefined])).toBe(true);
      expect(isArray([{}, {}])).toBe(true);
    });

    it('should return false for invalid arrays', () => {
      expect(isArray(null)).toBe(false);
      expect(isArray(undefined)).toBe(false);
      expect(isArray(123)).toBe(false);
      expect(isArray('abc')).toBe(false);
      expect(isArray({})).toBe(false);
      expect(isArray(() => {})).toBe(false);
    });
  });
});
