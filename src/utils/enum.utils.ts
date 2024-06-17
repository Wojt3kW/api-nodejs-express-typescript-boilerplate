const isEnumValue = (enumObject: any, value: any): boolean => {
  const enumValues = Object.values(enumObject);
  return enumValues.includes(value);
};

export { isEnumValue };
