import {
  validateEmailAddress,
  type ValidateEmailAddressInput,
} from '../../src/logic/input-validation-formatting';

describe('SCEN-124: validateEmailAddress - Email not provided', () => {
  test('should return EMAIL_NOT_PROVIDED error when emailAddress is null', async () => {
    const input: ValidateEmailAddressInput = {
      emailAddress: null,
    };

    const result = await validateEmailAddress(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedEmailAddress).toBe(null);
    expect(result.errorCode).toBe('EMAIL_NOT_PROVIDED');
  });
});
