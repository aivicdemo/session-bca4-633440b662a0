import { validateUserInformationRequired, ValidateUserInformationRequiredOutput } from '../../src/logic/input-validation-formatting';

describe('SCEN-149: 複数フィールドで検証失敗が発生した場合、最初に検出されたエラーコードが優先されてerrorDetailsに全失敗が記録される', () => {
  it('should return first error and all errors in errorDetails when multiple validations fail', async () => {
    const input = {
      userName: null,
      emailAddress: 'invalid-email',
      department: null,
      maximumUserNameLength: 100,
      maximumDepartmentLength: 100,
    };

    const result = await validateUserInformationRequired(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedUserName).toBe(null);
    expect(result.validatedEmailAddress).toBe(null);
    expect(result.validatedDepartment).toBe(null);
    expect(result.errorCode).toBe('UserNameEmptyError');
    expect(result.errorDetails).toHaveLength(3);
    expect(result.errorDetails).toContainEqual({
      field: 'userName',
      errorCode: 'UserNameEmptyError',
    });
    expect(result.errorDetails).toContainEqual({
      field: 'emailAddress',
      errorCode: 'UserEmailAddressFormatInvalidError',
    });
    expect(result.errorDetails).toContainEqual({
      field: 'department',
      errorCode: 'UserDepartmentEmptyError',
    });
  });
});
