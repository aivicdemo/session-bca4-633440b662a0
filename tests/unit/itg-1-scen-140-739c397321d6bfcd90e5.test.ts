import { validateEmailAddress, ValidateEmailAddressInput, ValidateEmailAddressOutput } from '../../src/logic/input-validation-formatting';

describe('SCEN-140: ドメイン部にハイフンが含まれた正当な形式のメールアドレスを入力した場合、有効と判定される', () => {
  test('should validate email with hyphen in domain as valid', () => {
    const input: ValidateEmailAddressInput = {
      emailAddress: 'user-name@example-domain.co.jp',
    };

    const result: ValidateEmailAddressOutput = validateEmailAddress(input);

    expect(result.isValid).toBe(true);
    expect(result.validatedEmailAddress).toBe('user-name@example-domain.co.jp');
    expect(result.errorCode).toBeNull();
  });
});
