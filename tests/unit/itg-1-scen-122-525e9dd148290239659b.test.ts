import { validateEmailAddress, ValidateEmailAddressInput, ValidateEmailAddressOutput } from '../../src/logic/input-validation-formatting';

describe('SCEN-122: 標準的な正当なメールアドレスを入力した場合、有効と判定され正規化されたアドレスが返される', () => {
  it('標準的な正当なメールアドレスを入力したとき、有効と判定され正規化されたアドレスが返される', () => {
    const input: ValidateEmailAddressInput = {
      emailAddress: 'user@example.com',
    };

    const result: ValidateEmailAddressOutput = validateEmailAddress(input);

    expect(result.isValid).toBe(true);
    expect(result.validatedEmailAddress).toBe('user@example.com');
    expect(result.errorCode).toBeNull();
  });
});
