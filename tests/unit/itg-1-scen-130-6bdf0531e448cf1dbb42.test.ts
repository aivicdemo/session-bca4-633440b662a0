import { describe, it, expect } from '@jest/globals';
import {
  validateEmailAddress,
  ValidateEmailAddressInput,
  ValidateEmailAddressOutput,
} from '../../src/logic/input-validation-formatting';

describe('SCEN-130: @記号が2個以上含まれている場合、INVALID_EMAIL_FORMAT エラーが返される', () => {
  it('@記号が2個以上含まれるメールアドレス（user@@example.com）を入力した場合、isValid=false、validatedEmailAddress=null、errorCode=\"INVALID_EMAIL_FORMAT\"を返す', async () => {
    const input: ValidateEmailAddressInput = {
      emailAddress: 'user@@example.com',
    };

    const result: ValidateEmailAddressOutput = await validateEmailAddress(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.errorCode).toBe('INVALID_EMAIL_FORMAT');
  });

  it('@記号が2個以上含まれるメールアドレス（user@exam@ple.com）を入力した場合、isValid=false、validatedEmailAddress=null、errorCode=\"INVALID_EMAIL_FORMAT\"を返す', async () => {
    const input: ValidateEmailAddressInput = {
      emailAddress: 'user@exam@ple.com',
    };

    const result: ValidateEmailAddressOutput = await validateEmailAddress(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.errorCode).toBe('INVALID_EMAIL_FORMAT');
  });
});
