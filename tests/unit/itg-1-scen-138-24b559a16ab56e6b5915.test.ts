import {
  validateEmailAddress,
  ValidateEmailAddressInput,
  ValidateEmailAddressOutput,
} from '../../src/logic/input-validation-formatting';

describe('SCEN-138: ローカル部にアンダースコアが含まれた正当な形式のメールアドレスを入力した場合、有効と判定される', () => {
  it('should validate email with underscore in local part as valid', async () => {
    const input: ValidateEmailAddressInput = {
      emailAddress: 'user_name@example.com',
    };

    const output: ValidateEmailAddressOutput = await validateEmailAddress(input);

    expect(output.isValid).toBe(true);
    expect(output.validatedEmailAddress).toBe('user_name@example.com');
    expect(output.errorCode).toBeNull();
  });
});
