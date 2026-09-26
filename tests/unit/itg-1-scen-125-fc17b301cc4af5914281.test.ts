import { describe, it, expect } from '@jest/globals';
import {
  validateEmailAddress,
  ValidateEmailAddressInput,
  ValidateEmailAddressOutput,
  EmailAddressNotProvidedError,
} from '../../src/logic/input-validation-formatting';

describe('SCEN-125: メールアドレスがnull の場合、EMAIL_NOT_PROVIDED エラーが返される', () => {
  it('validateEmailAddress関数を呼び出す際、入力型ValidateEmailAddressInputのemailAddressフィールドにnullを設定し、関数の戻り値である出力型ValidateEmailAddressOutputを確認する', async () => {
    const input: ValidateEmailAddressInput = {
      emailAddress: null,
    };

    const result: ValidateEmailAddressOutput = await validateEmailAddress(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.errorCode).toBe('EmailAddressEmptyError');
  });

  it('出力型ValidateEmailAddressOutputのフィールドが以下の値を返す：isValid=false、validatedEmailAddress=null、errorCodeが返される', async () => {
    const input: ValidateEmailAddressInput = {
      emailAddress: null,
    };

    const result: ValidateEmailAddressOutput = await validateEmailAddress(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.errorCode).toBeTruthy();
  });
});
