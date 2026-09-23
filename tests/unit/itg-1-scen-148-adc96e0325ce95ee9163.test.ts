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

describe('SCEN-148: 所属の文字数が指定された最大許容文字数を超える場合、UserDepartmentFormatInvalidErrorが発生して所属の確定値がnullになる', () => {
  test('should return error when department exceeds maximum length', () => {
    const input: ValidateUserInformationRequiredInput = {
      userName: '太郎',
      emailAddress: 'taro@example.com',
      department: 'a'.repeat(101),
      maximumDepartmentLength: 100,
    };

    const result: ValidateUserInformationRequiredOutput = validateUserInformationRequired(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedUserName).toBe('太郎');
    expect(result.validatedEmailAddress).toBe('taro@example.com');
    expect(result.validatedDepartment).toBeNull();
    expect(result.errorCode).toBe('UserNameFormatInvalidError');
    expect(result.errorDetails).toContainEqual({
      field: 'department',
      errorCode: 'UserNameFormatInvalidError',
    });
  });
});
