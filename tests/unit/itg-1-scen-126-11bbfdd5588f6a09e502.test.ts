import { describe, it, expect } from '@jest/globals';
import {
  validateEmailAddress,
  ValidateEmailAddressInput,
  ValidateEmailAddressOutput,
  EmailAddressNotProvidedError,
} from '../../src/logic/input-validation-formatting';

describe('SCEN-126: メールアドレスが undefined の場合、EMAIL_NOT_PROVIDED エラーが返される', () => {
  it('validateEmailAddress関数を呼び出す際、入力型ValidateEmailAddressInputのemailAddressフィールドにundefinedを設定し、関数が返却する出力型ValidateEmailAddressOutputを検証する', async () => {
    const input: ValidateEmailAddressInput = {
      emailAddress: undefined,
    };

    const result: ValidateEmailAddressOutput = await validateEmailAddress(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.errorCode).toBe('EmailAddressEmptyError');
  });

  it('出力型の以下の値が返される：isValidはfalse、validatedEmailAddressはnull、errorCodeが返される', async () => {
    const input: ValidateEmailAddressInput = {
      emailAddress: undefined,
    };

    const result: ValidateEmailAddressOutput = await validateEmailAddress(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.errorCode).toBeTruthy();
  });
});
