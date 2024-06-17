import { isNullOrUndefined } from './object.utils';

const isString = (value: any): boolean => {
  return typeof value === 'string';
}

const isEmptyString = (value: any): boolean => {
  return isString(value) && value.trim().length === 0;
};

const isNullOrEmptyString = (value: any): boolean => {
  return isNullOrUndefined(value) || isEmptyString(value);
};

export { isEmptyString, isNullOrEmptyString, isString };
