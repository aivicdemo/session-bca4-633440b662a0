import { validateUserInformationRequired, ValidateUserInformationRequiredOutput } from '../../src/logic/input-validation-formatting';

describe('SCEN-144: メールアドレスフィールドがnull・undefined・空白のみの場合、UserEmailAddressEmptyErrorが発生してメールアドレスの確定値がnullになる', () => {
  it('should return UserEmailAddressEmptyError when emailAddress is null', async () => {
    const input = {
      userName: '田中太郎',
      emailAddress: null,
      department: '営業部',
      maximumUserNameLength: 100,
      maximumDepartmentLength: 100,
    };

    const result = await validateUserInformationRequired(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedUserName).toBe('田中太郎');
    expect(result.validatedEmailAddress).toBe(null);
    expect(result.validatedDepartment).toBe('営業部');
    expect(result.errorCode).toBe('UserEmailAddressEmptyError');
    expect(result.errorDetails).toContainEqual({
      field: 'emailAddress',
      errorCode: 'UserEmailAddressEmptyError',
    });
  });
});
