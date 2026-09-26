import { validateUserInformationRequired, ValidateUserInformationRequiredOutput } from '../../src/logic/input-validation-formatting';

describe('SCEN-147: 名前の文字数が指定された最大許容文字数を超える場合、UserNameFormatInvalidErrorが発生して名前の確定値がnullになる', () => {
  it('should return UserNameFormatInvalidError when userName exceeds maximum length', async () => {
    const longName = 'あ'.repeat(101);
    const input = {
      userName: longName,
      emailAddress: 'user@example.com',
      department: '営業部',
      maximumUserNameLength: 100,
      maximumDepartmentLength: 100,
    };

    const result = await validateUserInformationRequired(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedUserName).toBe(null);
    expect(result.validatedEmailAddress).toBe('user@example.com');
    expect(result.validatedDepartment).toBe('営業部');
    expect(result.errorCode).toBe('UserNameFormatInvalidError');
  });
});
