import { validateUserInformationRequired, UserNameEmptyError } from '../../src/logic/input-validation-formatting';
import type { ValidateUserInformationRequiredInput, ValidateUserInformationRequiredOutput } from '../../src/logic/input-validation-formatting';

describe('SCEN-154: チームリーダーが名前が空または空白のみの状態で検証した場合、名前を入力してくださいという指定文言でエラーになる', () => {
  test('名前が空文字列の場合、UserNameEmptyErrorが返される', () => {
    const input: ValidateUserInformationRequiredInput = {
      userName: '',
      emailAddress: 'test@example.com',
      department: '営業部'
    };

    const result: ValidateUserInformationRequiredOutput = validateUserInformationRequired(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedUserName).toBeNull();
    expect(result.errorCode).toBe('UserNameEmptyError');
    expect(result.errorDetails).toContainEqual({
      field: 'userName',
      errorCode: 'UserNameEmptyError'
    });
  });

  test('エラーメッセージが「名前は1文字以上で入力してください。」であること', () => {
    const input: ValidateUserInformationRequiredInput = {
      userName: '',
      emailAddress: 'test@example.com',
      department: '営業部'
    };

    expect(() => validateUserInformationRequired(input)).toThrow(UserNameEmptyError);
    try {
      validateUserInformationRequired(input);
    } catch (error) {
      if (error instanceof UserNameEmptyError) {
        expect(error.message).toBe('名前は1文字以上で入力してください。');
      }
    }
  });

  test('名前が空白のみの場合もエラーになる', () => {
    const input: ValidateUserInformationRequiredInput = {
      userName: '   ',
      emailAddress: 'test@example.com',
      department: '営業部'
    };

    const result: ValidateUserInformationRequiredOutput = validateUserInformationRequired(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedUserName).toBeNull();
    expect(result.errorCode).toBe('UserNameEmptyError');
  });
});
