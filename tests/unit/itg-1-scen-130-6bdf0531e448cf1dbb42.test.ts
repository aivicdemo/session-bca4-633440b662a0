import { describe, it, expect } from '@jest/globals';
import {
  validateEmailAddress,
  ValidateEmailAddressInput,
  ValidateEmailAddressOutput,
} from '../../src/logic/input-validation-formatting';

describe('SCEN-130: @記号が2個以上含まれている場合、INVALID_EMAIL_FORMAT エラーが返される', () => {
  it('validateEmailAddress関数を呼び出す際、入力型ValidateEmailAddressInputのemailAddressフィールドに@記号が2個以上含まれるメールアドレス文字列（例：「user@@example.com」）を設定し、関数が返却する出力型ValidateEmailAddressOutputを取得する', async () => {
    const input: ValidateEmailAddressInput = {
      emailAddress: 'user@@example.com',
    };

    const result: ValidateEmailAddressOutput = await validateEmailAddress(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.errorCode).toBe('INVALID_EMAIL_FORMAT');
  });

  it('出力のisValidフィールドがfalseであることを確認し、出力のvalidatedEmailAddressフィールドがnullであることを確認し、出力のerrorCodeフィールドが「INVALID_EMAIL_FORMAT」であることを確認する', async () => {
    const input: ValidateEmailAddressInput = {
      emailAddress: 'user@exam@ple.com',
    };

    const result: ValidateEmailAddressOutput = await validateEmailAddress(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.errorCode).toBe('INVALID_EMAIL_FORMAT');
  });

  it('validateEmailAddress関数は以下を返す：isValid=false、validatedEmailAddress=null、errorCode=\"INVALID_EMAIL_FORMAT」である', async () => {
    const input: ValidateEmailAddressInput = {
      emailAddress: 'user@@example.com',
    };

    const result: ValidateEmailAddressOutput = await validateEmailAddress(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.errorCode).toBe('INVALID_EMAIL_FORMAT');
  });
});
