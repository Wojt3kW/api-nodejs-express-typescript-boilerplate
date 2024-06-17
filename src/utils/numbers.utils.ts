const toNumber = (value: any): number | null => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'number') {
    if (isFinite(value)) {
      return value + 0;
    } else {
      return null;
    }
  }

  if (typeof value === 'string') {
    if ((value + '').trim().length === 0) {
      return null;
    }

    value = (value + '').trim().replace(',', '.').replace(/\s/g, '');

    // eslint-disable-next-line eqeqeq
    return value == value * 1 ? toNumber(value * 1) : null;
  }

  return null;
}

const isNumber = (value: any): boolean => {
  return toNumber(value) !== null;
}

const isPositiveNumber = (value: any): boolean => {
  return (toNumber(value) ?? 0) > 0;
}

export { isNumber, isPositiveNumber, toNumber };
