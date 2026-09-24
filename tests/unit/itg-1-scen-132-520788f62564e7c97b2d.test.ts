import { validateEmailAddress, ValidateEmailAddressInput, ValidateEmailAddressOutput } from '../../src/logic/input-validation-formatting';

describe('SCEN-132: @の前の部分に不正な文字が含まれている場合、INVALID_EMAIL_FORMAT エラーが返される', () => {
  it('should return isValid=false, validatedEmailAddress=null, errorCode=INVALID_EMAIL_FORMAT when local part has invalid characters', () => {
    const input: ValidateEmailAddressInput = {
      emailAddress: 'user @example.com',
    };

    const result: ValidateEmailAddressOutput = validateEmailAddress(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.errorCode).toBe('INVALID_EMAIL_FORMAT');
  });
});
