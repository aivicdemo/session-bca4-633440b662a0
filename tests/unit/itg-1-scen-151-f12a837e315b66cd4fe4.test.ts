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

describe('SCEN-151: 報告者が入力した名前が空白のみで構成されている場合、trimして長さ判定により名前が不正と判断される', () => {
  test('should return UserNameEmptyError when userName is whitespace only', () => {
    const input: ValidateUserInformationRequiredInput = {
      userName: '   ',
      emailAddress: 'user@example.com',
      department: '営業部',
    };

    const result: ValidateUserInformationRequiredOutput = validateUserInformationRequired(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedUserName).toBeNull();
    expect(result.validatedEmailAddress).toBe('user@example.com');
    expect(result.validatedDepartment).toBe('営業部');
    expect(result.errorCode).toBe('UserNameEmptyError');
    expect(result.errorDetails).toContainEqual({
      field: 'userName',
      errorCode: 'UserNameEmptyError',
    });
  });
});
