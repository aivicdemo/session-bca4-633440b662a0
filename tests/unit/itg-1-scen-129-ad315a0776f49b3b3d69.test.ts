import { describe, it, expect } from '@jest/globals';
import {
  validateEmailAddress,
  ValidateEmailAddressInput,
  ValidateEmailAddressOutput,
} from '../../src/logic/input-validation-formatting';

describe('SCEN-129: メールアドレスに.記号が含まれていない場合、INVALID_EMAIL_FORMAT エラーが返される', () => {
  it('validateEmailAddress関数を呼び出す際に、emailAddressフィールドに「.」記号が含まれていないメールアドレス文字列を入力し、例えば「userexamplecom」を入力して関数の戻り値を確認する', async () => {
    const input: ValidateEmailAddressInput = {
      emailAddress: 'userexamplecom',
    };

    const result: ValidateEmailAddressOutput = await validateEmailAddress(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.errorCode).toBe('INVALID_EMAIL_FORMAT');
  });

  it('isValidがfalseを返し、validatedEmailAddressがnullを返し、errorCodeが\'INVALID_EMAIL_FORMAT\'である', async () => {
    const input: ValidateEmailAddressInput = {
      emailAddress: 'user@examplecom',
    };

    const result: ValidateEmailAddressOutput = await validateEmailAddress(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.errorCode).toBe('INVALID_EMAIL_FORMAT');
  });
});
