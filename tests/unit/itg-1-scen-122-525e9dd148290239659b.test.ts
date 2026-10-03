import {
  validateEmailAddress,
  type ValidateEmailAddressInput,
} from '../../src/logic/input-validation-formatting';

describe('SCEN-122: validateEmailAddress - Valid email format', () => {
  test('should return valid result for standard valid email address', async () => {
    const input: ValidateEmailAddressInput = {
      emailAddress: 'user@example.com',
    };

    const result = await validateEmailAddress(input);

    expect(result.isValid).toBe(true);
    expect(result.validatedEmailAddress).toBe('user@example.com');
    expect(result.errorCode).toBe(null);
  });
});
