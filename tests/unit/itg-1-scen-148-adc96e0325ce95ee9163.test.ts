import { validateUserInformationRequired, ValidateUserInformationRequiredOutput } from '../../src/logic/input-validation-formatting';

describe('SCEN-148: 所属の文字数が指定された最大許容文字数を超える場合、UserDepartmentFormatInvalidErrorが発生して所属の確定値がnullになる', () => {
  it('should return UserDepartmentFormatInvalidError when department exceeds maximum length', async () => {
    const longDepartment = 'a'.repeat(101);
    const input = {
      userName: '太郎',
      emailAddress: 'taro@example.com',
      department: longDepartment,
      maximumUserNameLength: 100,
      maximumDepartmentLength: 100,
    };

    const result = await validateUserInformationRequired(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedUserName).toBe('太郎');
    expect(result.validatedEmailAddress).toBe('taro@example.com');
    expect(result.validatedDepartment).toBe(null);
    expect(result.errorCode).toBe('UserDepartmentFormatInvalidError');
    expect(result.errorDetails).toContainEqual({
      field: 'department',
      errorCode: 'UserDepartmentFormatInvalidError',
    });
  });
});
