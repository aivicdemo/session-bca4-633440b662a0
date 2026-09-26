import { validateEmailAddress, ValidateEmailAddressInput, ValidateEmailAddressOutput } from '../../src/logic/input-validation-formatting';

describe('SCEN-136: ローカル部にドットが含まれた正当な形式のメールアドレスを入力した場合、有効と判定される', () => {
  it('should return isValid=true, validatedEmailAddress with email, errorCode=null for valid email with dot in local part', async () => {
    const input: ValidateEmailAddressInput = {
      emailAddress: 'john.doe@example.com',
    };

    const result: ValidateEmailAddressOutput = await validateEmailAddress(input);

    expect(result.isValid).toBe(true);
    expect(result.validatedEmailAddress).toBe('john.doe@example.com');
    expect(result.errorCode).toBeNull();
  });
});
