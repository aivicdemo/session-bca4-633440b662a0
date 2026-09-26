import {
  validateEmailAddress,
  ValidateEmailAddressInput,
  ValidateEmailAddressOutput,
} from '../../src/logic/input-validation-formatting';

describe('SCEN-141: メールアドレスの前後に空白がある場合、トリミング後に検証され有効と判定される', () => {
  it('should trim whitespace and validate email as valid', async () => {
    const input: ValidateEmailAddressInput = {
      emailAddress: '  user@example.com  ',
    };

    const output = await validateEmailAddress(input);

    expect(output.isValid).toBe(true);
    expect(output.validatedEmailAddress).toBe('user@example.com');
    expect(output.errorCode).toBeNull();
  });
});
