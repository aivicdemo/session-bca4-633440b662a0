import {
  validateUserInformationRequired,
  UserDepartmentEmptyError,
} from '../../src/logic/input-validation-formatting';
import type {
  ValidateUserInformationRequiredInput,
  ValidateUserInformationRequiredOutput,
} from '../../src/logic/input-validation-formatting';

describe('SCEN-146: 所属フィールドがnull・undefined・空白のみの場合、UserDepartmentEmptyErrorが発生して所属の確定値がnullになる', () => {
  test('所属がnullで、メールアドレスと名前が有効な場合、isValidがfalse、validatedDepartmentがnull、errorCodeがUserDepartmentEmptyErrorになる', () => {
    const input: ValidateUserInformationRequiredInput = {
      userName: '田中太郎',
      emailAddress: 'tanaka@example.com',
      department: null,
    };

    const result: ValidateUserInformationRequiredOutput = validateUserInformationRequired(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedDepartment).toBeNull();
    expect(result.validatedUserName).toBe('田中太郎');
    expect(result.validatedEmailAddress).toBe('tanaka@example.com');
    expect(result.errorCode).toBe('UserDepartmentEmptyError');
    expect(result.errorDetails).toContainEqual({
      field: 'department',
      errorCode: 'UserDepartmentEmptyError',
    });
  });

  test('所属がnullの場合、UserDepartmentEmptyErrorが発生し、エラー文言が「所属は必須項目です。」であること', () => {
    const input: ValidateUserInformationRequiredInput = {
      userName: '田中太郎',
      emailAddress: 'tanaka@example.com',
      department: null,
    };

    expect(() => validateUserInformationRequired(input)).toThrow(UserDepartmentEmptyError);
    try {
      validateUserInformationRequired(input);
    } catch (error) {
      if (error instanceof UserDepartmentEmptyError) {
        expect(error.message).toBe('所属は必須項目です。');
      }
    }
  });
});
