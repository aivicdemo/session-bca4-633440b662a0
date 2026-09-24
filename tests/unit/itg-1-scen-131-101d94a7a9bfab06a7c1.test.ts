import { validateEmailAddress, ValidateEmailAddressInput, ValidateEmailAddressOutput } from '../../src/logic/input-validation-formatting';

describe('SCEN-131: @の前の部分が空の場合、INVALID_EMAIL_FORMAT エラーが返される', () => {
  it('should return isValid=false, validatedEmailAddress=null, errorCode=INVALID_EMAIL_FORMAT when local part before @ is empty', () => {
    const input: ValidateEmailAddressInput = {
      emailAddress: '@example.com',
    };

    const result: ValidateEmailAddressOutput = validateEmailAddress(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.errorCode).toBe('INVALID_EMAIL_FORMAT');
  });
});
