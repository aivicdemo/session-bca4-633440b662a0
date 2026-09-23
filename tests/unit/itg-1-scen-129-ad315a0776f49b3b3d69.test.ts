import { describe, it, expect } from '@jest/globals';
import {
  validateEmailAddress,
  ValidateEmailAddressInput,
  ValidateEmailAddressOutput,
  InvalidEmailFormatError,
} from '../../src/logic/input-validation-formatting';

describe('SCEN-129: メールアドレスに.記号が含まれていない場合、INVALID_EMAIL_FORMAT エラーが返される', () => {
  it('should return INVALID_EMAIL_FORMAT error when email does not contain dot symbol', () => {
    // validateEmailAddress関数を呼び出す際に、emailAddressフィールドに「.」記号が含まれていないメールアドレス文字列を入力する
    // 例えば、emailAddressに「userexamplecom」（@の後ろにドットなし）を入力値として渡す
    const input: ValidateEmailAddressInput = {
      emailAddress: 'userexamplecom',
    };

    // 関数の戻り値を確認する
    const result: ValidateEmailAddressOutput = validateEmailAddress(input);

    // isValidがfalseを返す
    expect(result.isValid).toBe(false);

    // validatedEmailAddressがnullを返す
    expect(result.validatedEmailAddress).toBeNull();

    // errorCodeが'INVALID_EMAIL_FORMAT'を返す
    expect(result.errorCode).toBe('INVALID_EMAIL_FORMAT');
  });
});
