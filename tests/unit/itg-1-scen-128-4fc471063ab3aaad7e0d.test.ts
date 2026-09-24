import { validateEmailAddress, ValidateEmailAddressInput, ValidateEmailAddressOutput } from '../../src/logic/input-validation-formatting';

describe('SCEN-128: メールアドレスに@記号が含まれていない場合、INVALID_EMAIL_FORMAT エラーが返される', () => {
  it('should return isValid=false, validatedEmailAddress=null, errorCode=INVALID_EMAIL_FORMAT when emailAddress lacks @ symbol', () => {
    const input: ValidateEmailAddressInput = {
      emailAddress: 'user.example.com',
    };

    const result: ValidateEmailAddressOutput = validateEmailAddress(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.errorCode).toBe('INVALID_EMAIL_FORMAT');
  });
});
