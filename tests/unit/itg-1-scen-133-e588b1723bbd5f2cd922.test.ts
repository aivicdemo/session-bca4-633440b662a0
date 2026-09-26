import { describe, it, expect } from '@jest/globals';
import { validateEmailAddress, ValidateEmailAddressInput, ValidateEmailAddressOutput } from '../../src/logic/input-validation-formatting';

describe('SCEN-133: @の後ろの部分が空の場合、INVALID_EMAIL_FORMAT エラーが返される', () => {
  it('@の後ろが空のメールアドレス（user@）で INVALID_EMAIL_FORMAT エラーが返される', async () => {
    const input: ValidateEmailAddressInput = {
      emailAddress: 'user@'
    };

    const output: ValidateEmailAddressOutput = await validateEmailAddress(input);

    expect(output.isValid).toBe(false);
    expect(output.validatedEmailAddress).toBeNull();
    expect(output.errorCode).toBe('INVALID_EMAIL_FORMAT');
  });
});
