import {
  validateEmailAddress,
  ValidateEmailAddressInput,
  ValidateEmailAddressOutput,
} from '../../src/logic/input-validation-formatting';

describe('SCEN-140: ドメイン部にハイフンが含まれた正当な形式のメールアドレスを入力した場合、有効と判定される', () => {
  it('should validate email with hyphen in domain as valid', async () => {
    const input: ValidateEmailAddressInput = {
      emailAddress: 'user-name@example-domain.co.jp',
    };

    const output: ValidateEmailAddressOutput = await validateEmailAddress(input);

    expect(output.isValid).toBe(true);
    expect(output.validatedEmailAddress).toBe('user-name@example-domain.co.jp');
    expect(output.errorCode).toBeNull();
  });
});
