import { isEnumValue } from './enum.utils';

enum ExampleStringEnum {
  Value1 = 'Value1',
  Value2 = 'Value2',
  Value3 = 'Value3',
}

enum ExampleNumberEnum {
  Value1 = 1,
  Value2 = 2,
  Value3,
}

describe('isEnumValue', () => {
  it('should return true when the value is a valid enum value', () => {
    let result = isEnumValue(ExampleStringEnum, ExampleStringEnum.Value1);
    expect(result).toBe(true);

    result = isEnumValue(ExampleNumberEnum, ExampleNumberEnum.Value1);
    expect(result).toBe(true);

    result = isEnumValue(ExampleNumberEnum, ExampleNumberEnum.Value3);
    expect(result).toBe(true);
  });

  it('should return false when the value is not a valid enum value', () => {
    let result = isEnumValue(ExampleStringEnum, 'InvalidValue');
    expect(result).toBe(false);

    result = isEnumValue(ExampleStringEnum, ExampleNumberEnum.Value1 - 1);
    expect(result).toBe(false);

    result = isEnumValue(ExampleStringEnum, ExampleNumberEnum.Value1 + 1000);
    expect(result).toBe(false);
  });
});
