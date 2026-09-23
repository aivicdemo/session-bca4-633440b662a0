import { describe, it, expect } from '@jest/globals';
import {
  validateEmailAddress,
  ValidateEmailAddressInput,
  ValidateEmailAddressOutput,
  InvalidEmailFormatError,
} from '../../src/logic/input-validation-formatting';

describe('SCEN-130: @記号が2個以上含まれている場合、INVALID_EMAIL_FORMAT エラーが返される', () => {
  it('should return INVALID_EMAIL_FORMAT error when email contains two or more @ symbols', () => {
    // validateEmailAddress関数を呼び出す際、入力型ValidateEmailAddressInputのemailAddressフィールドに
    // @記号が2個以上含まれるメールアドレス文字列を設定する
    const inputWithDoubleAt: ValidateEmailAddressInput = {
      emailAddress: 'user@@example.com',
    };

    // 関数が返却する出力型ValidateEmailAddressOutputを取得する
    const resultDoubleAt: ValidateEmailAddressOutput = validateEmailAddress(inputWithDoubleAt);

    // 出力のisValidフィールドがfalseであることを確認する
    expect(resultDoubleAt.isValid).toBe(false);

    // 出力のvalidatedEmailAddressフィールドがnullであることを確認する
    expect(resultDoubleAt.validatedEmailAddress).toBeNull();

    // 出力のerrorCodeフィールドが「INVALID_EMAIL_FORMAT」であることを確認する
    expect(resultDoubleAt.errorCode).toBe('INVALID_EMAIL_FORMAT');

    // 別の例「user@exam@ple.com」も同様の結果を返す
    const inputWithMultipleAt: ValidateEmailAddressInput = {
      emailAddress: 'user@exam@ple.com',
    };

    const resultMultipleAt: ValidateEmailAddressOutput = validateEmailAddress(inputWithMultipleAt);

    expect(resultMultipleAt.isValid).toBe(false);
    expect(resultMultipleAt.validatedEmailAddress).toBeNull();
    expect(resultMultipleAt.errorCode).toBe('INVALID_EMAIL_FORMAT');
  });
});
