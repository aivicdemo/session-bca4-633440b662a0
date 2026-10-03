import { validateUserInformationRequired } from '../../src/logic/input-validation-formatting';

describe('SCEN-152: 報告者が名前フィールドを空のまま送信しようとした場合、名前は必ず入力してくださいという指定文言でエラーになる', () => {
  it('should return UserNameEmptyError when userName is empty string', async () => {
    const result = await validateUserInformationRequired({
      userName: '',
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
