import { describe, it, expect } from '@jest/globals';
import { validateEmailAddress, ValidateEmailAddressInput, ValidateEmailAddressOutput } from '../../src/logic/input-validation-formatting';

describe('SCEN-132: @の前の部分に不正な文字が含まれている場合、INVALID_EMAIL_FORMAT エラーが返される', () => {
  it('@の前に不正な文字を含むメールアドレス（user@#example.com）で INVALID_EMAIL_FORMAT エラーが返される', async () => {
    const input: ValidateEmailAddressInput = {
      emailAddress: 'user@#example.com'
    };

    const output: ValidateEmailAddressOutput = await validateEmailAddress(input);

    expect(output.isValid).toBe(false);
    expect(output.validatedEmailAddress).toBeNull();
    expect(output.errorCode).toBe('INVALID_EMAIL_FORMAT');
  });

  it('@の前にスペースを含むメールアドレス（user name@example.com）で INVALID_EMAIL_FORMAT エラーが返される', async () => {
    const input: ValidateEmailAddressInput = {
      emailAddress: 'user name@example.com'
    };

    const output: ValidateEmailAddressOutput = await validateEmailAddress(input);

    expect(output.isValid).toBe(false);
    expect(output.validatedEmailAddress).toBeNull();
    expect(output.errorCode).toBe('INVALID_EMAIL_FORMAT');
  });

  it('@の前に特殊文字を含むメールアドレス（user!@example.com）で INVALID_EMAIL_FORMAT エラーが返される', async () => {
    const input: ValidateEmailAddressInput = {
      emailAddress: 'user!@example.com'
    };

    const output: ValidateEmailAddressOutput = await validateEmailAddress(input);

    expect(output.isValid).toBe(false);
    expect(output.validatedEmailAddress).toBeNull();
    expect(output.errorCode).toBe('INVALID_EMAIL_FORMAT');
  });
});
