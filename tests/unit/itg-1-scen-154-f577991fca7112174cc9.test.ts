import { validateUserInformationRequired } from '../../src/logic/input-validation-formatting';

describe('SCEN-154: チームリーダーが名前が空または空白のみの状態で検証した場合、名前を入力してくださいという指定文言でエラーになる', () => {
  it('should return UserNameEmptyError when userName is empty string', async () => {
    const result = await validateUserInformationRequired({
      userName: '',
      emailAddress: 'test@example.com',
      department: '営業部'
    });

    expect(result.isValid).toBe(false);
    expect(result.validatedUserName).toBeNull();
    expect(result.errorCode).toBe('UserNameEmptyError');
    expect(result.errorDetails).toContainEqual({
      field: 'userName',
      errorCode: 'UserNameEmptyError'
    });
  });
});
