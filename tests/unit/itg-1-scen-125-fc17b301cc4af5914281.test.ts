import { describe, it, expect } from '@jest/globals';
import {
  validateEmailAddress,
  EmailAddressNotProvidedError,
  ValidateEmailAddressInput,
  ValidateEmailAddressOutput
} from '../../src/logic/input-validation-formatting';

describe('SCEN-125: validateEmailAddress - null input', () => {
  it('should return EMAIL_NOT_PROVIDED error when emailAddress is null', async () => {
    const input: ValidateEmailAddressInput = {
      emailAddress: null
    };

    const result: ValidateEmailAddressOutput = await validateEmailAddress(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.errorCode).toBe('EMAIL_NOT_PROVIDED');
  });

  it('should have EmailAddressNotProvidedError with message', () => {
    const error = new EmailAddressNotProvidedError('メールアドレスを入力してください。');
    expect(error.message).toBe('メールアドレスを入力してください。');
    expect(error).toBeInstanceOf(EmailAddressNotProvidedError);
  });
});
