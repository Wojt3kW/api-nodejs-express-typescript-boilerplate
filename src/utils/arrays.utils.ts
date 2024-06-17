/* eslint-disable no-prototype-builtins */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import { isNullOrUndefined } from './object.utils';

const objectsEqual = (x: any, y: any): boolean => {
  if (x === y) {
    return true;
  }

  if (!(x instanceof Object) || !(y instanceof Object)) {
    return false;
  }

  if (x.constructor !== y.constructor) {
    return false;
  }

  if (
    (typeof x === 'function' && typeof y === 'function') ||
    (x instanceof Date && y instanceof Date) ||
    (x instanceof RegExp && y instanceof RegExp) ||
    (x instanceof String && y instanceof String) ||
    (x instanceof Number && y instanceof Number)
  ) {
    return x.toString() === y.toString();
  }

  for (const p in x) {
    if (!x.hasOwnProperty(p)) {
      continue;
    }

    if (!y.hasOwnProperty(p)) {
      return false;
    }

    if (x[p] === y[p]) {
      continue;
    }

    if (typeof x[p] !== 'object') {
      return false;
    }

    if (!objectsEqual(x[p], y[p])) {
      return false;
    }
  }

  for (const p in y) {
    if (y.hasOwnProperty(p) && !x.hasOwnProperty(p)) {
      return false;
    }
  }

  return true;
};

const arraysEquals = (arr1: any[] | null | undefined, arr2: any[] | null | undefined): boolean => {
  if (
    (isNullOrUndefined(arr1) && isNullOrUndefined(arr2)) ||
    (isNullOrUndefined(arr1) && (arr2?.length ?? 0) === 0) ||
    (isNullOrUndefined(arr2) && (arr1?.length ?? 0) === 0) ||
    ((arr1?.length ?? 0) === 0 && (arr2?.length ?? 0) === 0)
  ) {
    return true;
  } else if (
    (isNullOrUndefined(arr1) && (arr2?.length ?? 0) > 0) ||
    (isNullOrUndefined(arr2) && (arr1?.length ?? 0) > 0) ||
    arr1?.length !== arr2?.length
  ) {
    return false;
  }

  const uniqueArr1 = arr1!.filter(obj => {
    return !arr2!.some((obj2: any) => objectsEqual(obj, obj2));
  });

  const uniqueArr2 = arr2!.filter((obj: any) => {
    return !arr1!.some(obj2 => objectsEqual(obj, obj2));
  });

  return arr1?.length === arr2?.length && uniqueArr1?.length === 0 && uniqueArr2?.length === 0;
};

const isArray = (array: any): boolean => {
  if (isNullOrUndefined(array) || isNullOrUndefined(array.length)) {
    return false;
  }

  return Array.isArray(array);
};

const isArrayEmpty = (array: any): boolean => {
  return isArray(array) && array.length === 0;
};

export { arraysEquals, isArray, isArrayEmpty };
