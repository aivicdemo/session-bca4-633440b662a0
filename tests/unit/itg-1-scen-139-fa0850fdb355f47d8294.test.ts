import { validateEmailAddress, ValidateEmailAddressInput, ValidateEmailAddressOutput } from '../../src/logic/input-validation-formatting';

describe('SCEN-139: トップレベルドメインが2文字の場合、有効と判定される', () => {
  test('should validate email with 2-character TLD as valid', () => {
    const input: ValidateEmailAddressInput = {
      emailAddress: 'user@example.co',
    };

    const result: ValidateEmailAddressOutput = validateEmailAddress(input);

    expect(result.isValid).toBe(true);
    expect(result.validatedEmailAddress).toBe('user@example.co');
    expect(result.errorCode).toBeNull();
  });
});
