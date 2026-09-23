import { describe, it, expect } from '@jest/globals';
import {
  validateEmailAddress,
  ValidateEmailAddressInput,
  ValidateEmailAddressOutput,
  EmailAddressNotProvidedError,
} from '../../src/logic/input-validation-formatting';

describe('SCEN-124: メールアドレスが入力されていない場合、EMAIL_NOT_PROVIDED エラーが返される', () => {
  it('メールアドレスがnullのとき、EMAIL_NOT_PROVIDED エラーが返される', async () => {
    const input: ValidateEmailAddressInput = {
      emailAddress: null,
    };

    const result: ValidateEmailAddressOutput = await validateEmailAddress(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.errorCode).toBe('EMAIL_NOT_PROVIDED');
  });

  it('メールアドレスがnullのとき、EmailAddressNotProvidedError が発生する', async () => {
    const input: ValidateEmailAddressInput = {
      emailAddress: null,
    };

    try {
      await validateEmailAddress(input);
    } catch (error) {
      expect(error).toBeInstanceOf(EmailAddressNotProvidedError);
      expect((error as Error).message).toBe('メールアドレスを入力してください。');
    }
  });
});
