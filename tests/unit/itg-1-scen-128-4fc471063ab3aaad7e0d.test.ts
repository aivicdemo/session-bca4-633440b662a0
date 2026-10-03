import { describe, it, expect } from '@jest/globals';
import {
  validateEmailAddress,
  ValidateEmailAddressInput,
  ValidateEmailAddressOutput,
} from '../../src/logic/input-validation-formatting';

describe('SCEN-128: メールアドレスに@記号が含まれていない場合、INVALID_EMAIL_FORMAT エラーが返される', () => {
  it('@記号が含まれていないメールアドレスを入力した場合、isValidがfalse、validatedEmailAddressがnull、errorCodeが「INVALID_EMAIL_FORMAT」となること', async () => {
    const input: ValidateEmailAddressInput = {
      emailAddress: 'user.example.com',
    };

    const result: ValidateEmailAddressOutput = await validateEmailAddress(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.errorCode).toBe('INVALID_EMAIL_FORMAT');
  });
});
