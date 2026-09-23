import { validateUserInformationRequired, UserEmailAddressEmptyError } from '../../src/logic/input-validation-formatting';
import type { ValidateUserInformationRequiredInput, ValidateUserInformationRequiredOutput } from '../../src/logic/input-validation-formatting';

describe('SCEN-155: チームリーダーがメールアドレスが空の状態で検証した場合、メールアドレスを入力してくださいという指定文言でエラーになる', () => {
  test('メールアドレスがnullの場合、UserEmailAddressEmptyErrorが返される', () => {
    const input: ValidateUserInformationRequiredInput = {
      userName: '田中太郎',
      emailAddress: null,
      department: '営業部'
    };

    const result: ValidateUserInformationRequiredOutput = validateUserInformationRequired(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.errorCode).toBe('UserEmailAddressEmptyError');
    expect(result.errorDetails).toContainEqual({
      field: 'emailAddress',
      errorCode: 'UserEmailAddressEmptyError'
    });
  });

  test('エラーコードがUserEmailAddressEmptyErrorであり、メッセージが「メールアドレスを入力してください。」であること', () => {
    const input: ValidateUserInformationRequiredInput = {
      userName: '田中太郎',
      emailAddress: null,
      department: '営業部'
    };

    expect(() => validateUserInformationRequired(input)).toThrow(UserEmailAddressEmptyError);
    try {
      validateUserInformationRequired(input);
    } catch (error) {
      if (error instanceof UserEmailAddressEmptyError) {
        expect(error.message).toBe('メールアドレスを入力してください。');
      }
    }
  });

  test('業務ルール br-tx_6-005 の制約「メールアドレスが空の場合 → メールアドレスを入力してください」が満たされている', () => {
    const input: ValidateUserInformationRequiredInput = {
      userName: '田中太郎',
      emailAddress: null,
      department: '営業部'
    };

    const result: ValidateUserInformationRequiredOutput = validateUserInformationRequired(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.errorCode).toBe('UserEmailAddressEmptyError');
  });
});
