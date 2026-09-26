import { describe, it, expect } from '@jest/globals';
import {
  validateEmailAddress,
  ValidateEmailAddressInput,
  ValidateEmailAddressOutput,
  EmailAddressNotProvidedError,
} from '../../src/logic/input-validation-formatting';

describe('SCEN-127: メールアドレスが空白のみの場合、EMAIL_NOT_PROVIDED エラーが返される', () => {
  it('validateEmailAddress関数を呼び出す際に、入力型ValidateEmailAddressInputのemailAddressフィールドに空白のみの文字列（例：「   」）を渡し、関数の戻り値である出力型ValidateEmailAddressOutputを取得する', async () => {
    const input: ValidateEmailAddressInput = {
      emailAddress: '   ',
    };

    const result: ValidateEmailAddressOutput = await validateEmailAddress(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.errorCode).toBe('EmailAddressEmptyError');
  });

  it('出力型ValidateEmailAddressOutputが以下の値を返す：isValid=false、validatedEmailAddress=null、errorCodeが返される', async () => {
    const input: ValidateEmailAddressInput = {
      emailAddress: '   ',
    };

    const result: ValidateEmailAddressOutput = await validateEmailAddress(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.errorCode).toBeTruthy();
  });
});
