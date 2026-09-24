import { validateEmailAddress, ValidateEmailAddressInput, ValidateEmailAddressOutput } from '../../src/logic/input-validation-formatting';

describe('SCEN-126: メールアドレスが undefined の場合、EMAIL_NOT_PROVIDED エラーが返される', () => {
  it('should return isValid=false, validatedEmailAddress=null, errorCode=EMAIL_NOT_PROVIDED when emailAddress is undefined', () => {
    const input: ValidateEmailAddressInput = {
      emailAddress: undefined,
    };

    const result: ValidateEmailAddressOutput = validateEmailAddress(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.errorCode).toBe('EMAIL_NOT_PROVIDED');
  });
});
