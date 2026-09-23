import { validateEmailAddress, ValidateEmailAddressInput, ValidateEmailAddressOutput } from '../../src/logic/input-validation-formatting';

describe('SCEN-141: メールアドレスの前後に空白がある場合、トリミング後に検証され有効と判定される', () => {
  test('should trim whitespace and validate email as valid', () => {
    const input: ValidateEmailAddressInput = {
      emailAddress: '  user@example.com  ',
    };

    const result: ValidateEmailAddressOutput = validateEmailAddress(input);

    expect(result.isValid).toBe(true);
    expect(result.validatedEmailAddress).toBe('user@example.com');
    expect(result.errorCode).toBeNull();
  });
});
