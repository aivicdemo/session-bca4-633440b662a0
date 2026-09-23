import { describe, it, expect } from '@jest/globals';
import {
  validateEmailAddress,
  ValidateEmailAddressInput,
  ValidateEmailAddressOutput,
  InvalidEmailFormatError,
} from '../../src/logic/input-validation-formatting';

describe('SCEN-131: @の前の部分が空の場合、INVALID_EMAIL_FORMAT エラーが返される', () => {
  it('should return INVALID_EMAIL_FORMAT error when the part before @ is empty', () => {
    // validateEmailAddress関数を呼び出す際、入力型ValidateEmailAddressInputのemailAddressフィールドに
    // 「@example.com」（@の前が空）を設定する
    const input: ValidateEmailAddressInput = {
      emailAddress: '@example.com',
    };

    // 関数の戻り値（出力型ValidateEmailAddressOutput）を取得する
    const result: ValidateEmailAddressOutput = validateEmailAddress(input);

    // 戻り値のisValidフィールドがfalseであることを検証する
    expect(result.isValid).toBe(false);

    // 戻り値のvalidatedEmailAddressフィールドがnullであることを検証する
    expect(result.validatedEmailAddress).toBeNull();

    // 戻り値のerrorCodeフィールドが「INVALID_EMAIL_FORMAT」であることを検証する
    expect(result.errorCode).toBe('INVALID_EMAIL_FORMAT');
  });
});
