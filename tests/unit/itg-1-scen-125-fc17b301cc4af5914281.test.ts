import { describe, it, expect } from '@jest/globals';
import {
  validateEmailAddress,
  ValidateEmailAddressInput,
  ValidateEmailAddressOutput,
  EmailAddressNotProvidedError,
} from '../../src/logic/input-validation-formatting';

describe('SCEN-125: メールアドレスがnull の場合、EMAIL_NOT_PROVIDED エラーが返される', () => {
  it('validateEmailAddress関数を呼び出す際、入力型ValidateEmailAddressInputのemailAddressフィールドにnullを設定する', async () => {
    const input: ValidateEmailAddressInput = {
      emailAddress: null,
    };

    const result: ValidateEmailAddressOutput = await validateEmailAddress(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.errorCode).toBe('EMAIL_NOT_PROVIDED');
  });

  it('設計済みエラーEmailAddressNotProvidedErrorが発生し、エラー文言は「メールアドレスを入力してください。」である', async () => {
    const input: ValidateEmailAddressInput = {
      emailAddress: null,
    };

    await expect(validateEmailAddress(input)).rejects.toThrow(EmailAddressNotProvidedError);
    await expect(validateEmailAddress(input)).rejects.toThrow('メールアドレスを入力してください。');
  });
});
