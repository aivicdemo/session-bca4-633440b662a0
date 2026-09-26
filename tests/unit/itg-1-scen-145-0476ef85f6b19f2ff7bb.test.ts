import { validateUserInformationRequired, ValidateUserInformationRequiredOutput } from '../../src/logic/input-validation-formatting';

describe('SCEN-145: メールアドレスがRFC 5322準拠でない形式の場合、UserEmailAddressFormatInvalidErrorが発生してメールアドレスの確定値がnullになる', () => {
  it('should return UserEmailAddressFormatInvalidError when emailAddress has invalid format', async () => {
    const input = {
      userName: '田中太郎',
      emailAddress: 'invalid..email@example.com',
      department: '営業部',
      maximumUserNameLength: 100,
      maximumDepartmentLength: 100,
    };

    const result = await validateUserInformationRequired(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedUserName).toBe('田中太郎');
    expect(result.validatedEmailAddress).toBe(null);
    expect(result.validatedDepartment).toBe('営業部');
    expect(result.errorCode).toBe('UserEmailAddressFormatInvalidError');
    expect(result.errorDetails).toContainEqual({
      field: 'emailAddress',
      errorCode: 'UserEmailAddressFormatInvalidError',
    });
  });
});
