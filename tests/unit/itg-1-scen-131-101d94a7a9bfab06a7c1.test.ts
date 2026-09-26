import { describe, it, expect } from '@jest/globals';
import { validateEmailAddress, ValidateEmailAddressInput, ValidateEmailAddressOutput } from '../../src/logic/input-validation-formatting';

describe('SCEN-131: @の前の部分が空の場合、INVALID_EMAIL_FORMAT エラーが返される', () => {
  it('@の前が空のメールアドレス（@example.com）で INVALID_EMAIL_FORMAT エラーが返される', async () => {
    const input: ValidateEmailAddressInput = {
      emailAddress: '@example.com'
    };

    const output: ValidateEmailAddressOutput = await validateEmailAddress(input);

    expect(output.isValid).toBe(false);
    expect(output.validatedEmailAddress).toBeNull();
    expect(output.errorCode).toBe('INVALID_EMAIL_FORMAT');
  });
});
