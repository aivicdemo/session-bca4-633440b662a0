import { validateUserInformationRequired } from '../../src/logic/input-validation-formatting';

describe('SCEN-151: 報告者が入力した名前が空白のみで構成されている場合、trimして長さ判定により名前が不正と判断される', () => {
  it('should return error when userName is whitespace-only after trim', async () => {
    const result = await validateUserInformationRequired({
      userName: '   ',
      emailAddress: 'user@example.com',
      department: '営業部'
    });

    expect(result.isValid).toBe(false);
    expect(result.validatedUserName).toBeNull();
    expect(result.validatedEmailAddress).toBe('user@example.com');
    expect(result.validatedDepartment).toBe('営業部');
    expect(result.errorCode).toBe('UserNameEmptyError');
    expect(result.errorDetails).toContainEqual({
      field: 'userName',
      errorCode: 'UserNameEmptyError'
    });
  });
});
