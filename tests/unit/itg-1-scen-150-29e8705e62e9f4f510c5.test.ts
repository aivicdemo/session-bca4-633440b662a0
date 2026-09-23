import {
  validateUserInformationRequired,
  ValidateUserInformationRequiredInput,
  ValidateUserInformationRequiredOutput,
} from '../../src/logic/input-validation-formatting';

jest.mock('../../src/logic/input-validation-formatting', () => {
  const actual = jest.requireActual('../../src/logic/input-validation-formatting');
  return {
    ...actual,
    validateEmailAddress: jest.fn((input) => ({
      isValid: true,
      validatedEmailAddress: input.emailAddress,
      errorCode: null,
    })),
  };
});

describe('SCEN-150: 最大許容文字数がデフォルト値を使用する場合、100文字以内で名前と所属が検証される', () => {
  test('should validate with default maximum lengths when not specified', () => {
    const input: ValidateUserInformationRequiredInput = {
      userName: '山田太郎',
      emailAddress: 'yamada.taro@example.com',
      department: '営業部',
    };

    const result: ValidateUserInformationRequiredOutput = validateUserInformationRequired(input);

    expect(result.isValid).toBe(true);
    expect(result.validatedUserName).toBe('山田太郎');
    expect(result.validatedEmailAddress).toBe('yamada.taro@example.com');
    expect(result.validatedDepartment).toBe('営業部');
    expect(result.errorCode).toBeNull();
    expect(result.errorDetails).toEqual([]);
  });
});
