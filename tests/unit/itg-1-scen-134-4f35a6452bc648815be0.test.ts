import { describe, it, expect } from '@jest/globals';
import { validateEmailAddress, ValidateEmailAddressInput, ValidateEmailAddressOutput } from '../../src/logic/input-validation-formatting';

describe('SCEN-134: ドメイン部分に.が含まれていない場合、INVALID_EMAIL_FORMAT エラーが返される', () => {
  it('ドメイン部分にドットが含まれていないメールアドレス（user@nodomain）で INVALID_EMAIL_FORMAT エラーが返される', async () => {
    const input: ValidateEmailAddressInput = {
      emailAddress: 'user@nodomain'
    };

    const output: ValidateEmailAddressOutput = await validateEmailAddress(input);

    expect(output.isValid).toBe(false);
    expect(output.validatedEmailAddress).toBeNull();
    expect(output.errorCode).toBe('INVALID_EMAIL_FORMAT');
  });
});
