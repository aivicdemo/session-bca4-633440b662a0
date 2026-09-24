import {
  validateEmailAddress,
  ValidateEmailAddressInput,
  ValidateEmailAddressOutput,
} from '../../src/logic/input-validation-formatting';

describe('SCEN-137: ローカル部にハイフンが含まれた正当な形式のメールアドレスを入力した場合、有効と判定される', () => {
  it('should validate email with hyphen in local part as valid', async () => {
    const input: ValidateEmailAddressInput = {
      emailAddress: 'user-name@example.com',
    };

    const output: ValidateEmailAddressOutput = await validateEmailAddress(input);

    expect(output.isValid).toBe(true);
    expect(output.validatedEmailAddress).toBe('user-name@example.com');
    expect(output.errorCode).toBeNull();
  });
});
