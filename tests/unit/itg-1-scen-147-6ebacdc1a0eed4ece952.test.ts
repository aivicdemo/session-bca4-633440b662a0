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

describe('SCEN-147: 名前の文字数が指定された最大許容文字数を超える場合、UserNameFormatInvalidErrorが発生して名前の確定値がnullになる', () => {
  test('should return UserNameFormatInvalidError when userName exceeds maximum length', () => {
    const input: ValidateUserInformationRequiredInput = {
      userName: 'あ'.repeat(101),
      emailAddress: 'user@example.com',
      department: '営業部',
      maximumUserNameLength: 100,
    };

    const result: ValidateUserInformationRequiredOutput = validateUserInformationRequired(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedUserName).toBeNull();
    expect(result.validatedEmailAddress).toBe('user@example.com');
    expect(result.validatedDepartment).toBe('営業部');
    expect(result.errorCode).toBe('UserNameFormatInvalidError');
  });
});
