import { describe, it, expect } from '@jest/globals';
import {
  validateEmailAddress,
  ValidateEmailAddressInput,
  ValidateEmailAddressOutput,
} from '../../src/logic/input-validation-formatting';

describe('SCEN-125: メールアドレスがnull の場合、EMAIL_NOT_PROVIDED エラーが返される', () => {
  it('メールアドレスがnullの場合、EMAIL_NOT_PROVIDED エラーが返される', async () => {
    const input: ValidateEmailAddressInput = {
      emailAddress: null,
    };

    const result: ValidateEmailAddressOutput = await validateEmailAddress(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.errorCode).toBe('EMAIL_NOT_PROVIDED');
  });
});
