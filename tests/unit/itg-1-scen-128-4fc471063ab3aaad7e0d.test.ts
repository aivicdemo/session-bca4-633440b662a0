import { describe, it, expect } from '@jest/globals';
import {
  validateEmailAddress,
  ValidateEmailAddressInput,
  ValidateEmailAddressOutput,
} from '../../src/logic/input-validation-formatting';

describe('SCEN-128: メールアドレスに@記号が含まれていない場合、INVALID_EMAIL_FORMAT エラーが返される', () => {
  it('validateEmailAddress関数に入力型ValidateEmailAddressInputを構成し、emailAddressフィールドに@記号が含まれていないメールアドレス（例：「user.example.com」）を指定して呼び出し、戻り値の出力型ValidateEmailAddressOutputを確認する', async () => {
    const input: ValidateEmailAddressInput = {
      emailAddress: 'user.example.com',
    };

    const result: ValidateEmailAddressOutput = await validateEmailAddress(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.errorCode).toBe('INVALID_EMAIL_FORMAT');
  });

  it('エラーコードがINVALID_EMAIL_FORMATであり、業務ルールbr-tx_6-003の制約「[throw] メールアドレスが『@』または『.』を含まないとき」に対応する', async () => {
    const input: ValidateEmailAddressInput = {
      emailAddress: 'user.example.com',
    };

    const result: ValidateEmailAddressOutput = await validateEmailAddress(input);

    expect(result.errorCode).toBe('INVALID_EMAIL_FORMAT');
    expect(result.isValid).toBe(false);
  });
});
