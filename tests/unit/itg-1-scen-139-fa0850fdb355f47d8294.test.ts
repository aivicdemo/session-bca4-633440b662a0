import {
  validateEmailAddress,
  ValidateEmailAddressInput,
  ValidateEmailAddressOutput,
} from '../../src/logic/input-validation-formatting';

describe('SCEN-139: トップレベルドメインが2文字の場合、有効と判定される', () => {
  it('should validate email with 2-character TLD as valid', async () => {
    const input: ValidateEmailAddressInput = {
      emailAddress: 'user@example.co',
    };

    const output: ValidateEmailAddressOutput = await validateEmailAddress(input);

    expect(output.isValid).toBe(true);
    expect(output.validatedEmailAddress).toBe('user@example.co');
    expect(output.errorCode).toBeNull();
  });
});
