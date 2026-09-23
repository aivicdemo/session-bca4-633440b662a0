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
      isValid: false,
      validatedEmailAddress: null,
      errorCode: 'UserEmailAddressFormatInvalidError',
    })),
  };
});

describe('SCEN-149: 複数フィールドで検証失敗が発生した場合、最初に検出されたエラーコードが優先されてerrorDetailsに全失敗が記録される', () => {
  test('should return first error code with all error details when multiple fields fail validation', () => {
    const input: ValidateUserInformationRequiredInput = {
      userName: null,
      emailAddress: 'invalid-email',
      department: null,
      maximumUserNameLength: 100,
      maximumDepartmentLength: 100,
    };

    const result: ValidateUserInformationRequiredOutput = validateUserInformationRequired(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedUserName).toBeNull();
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.validatedDepartment).toBeNull();
    expect(result.errorCode).toBe('UserNameEmptyError');
    expect(result.errorDetails).toEqual([
      { field: 'userName', errorCode: 'UserNameEmptyError' },
      { field: 'emailAddress', errorCode: 'UserEmailAddressFormatInvalidError' },
      { field: 'department', errorCode: 'UserDepartmentEmptyError' },
    ]);
  });
});
