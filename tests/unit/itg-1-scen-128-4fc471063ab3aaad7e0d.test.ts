import { describe, it, expect } from '@jest/globals';
import {
  validateEmailAddress,
  InvalidEmailFormatError,
  ValidateEmailAddressInput,
  ValidateEmailAddressOutput,
} from '../../src/logic/input-validation-formatting';

describe('SCEN-128: メールアドレスに@記号が含まれていない場合、INVALID_EMAIL_FORMAT エラーが返される', () => {
  it('should return INVALID_EMAIL_FORMAT error when email lacks @ symbol', () => {
    // ステップ1: validateEmailAddress関数に入力型ValidateEmailAddressInputを構成する
    const input: ValidateEmailAddressInput = {
      emailAddress: 'user.example.com',
    };

    // ステップ2: validateEmailAddress関数を呼び出す
    // ステップ3: 戻り値の出力型ValidateEmailAddressOutputを確認する
    // 期待結果:
    // - isValidがfalse
    // - validatedEmailAddressがnull
    // - errorCodeが「INVALID_EMAIL_FORMAT」
    // - InvalidEmailFormatErrorが発生
    // - エラー文言が「メールアドレスの形式が正しくありません。正しい形式で入力してください。」

    expect(() => {
      validateEmailAddress(input);
    }).toThrow(InvalidEmailFormatError);

    expect(() => {
      validateEmailAddress(input);
    }).toThrow('メールアドレスの形式が正しくありません。正しい形式で入力してください。');
  });
});
