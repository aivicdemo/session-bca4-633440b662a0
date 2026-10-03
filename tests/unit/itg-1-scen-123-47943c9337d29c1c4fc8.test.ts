import {
  validateEmailAddress,
  type ValidateEmailAddressInput,
} from '../../src/logic/input-validation-formatting';

describe('SCEN-123: validateEmailAddress - Invalid email format', () => {
  test('should return INVALID_EMAIL_FORMAT error for empty string', async () => {
    const input: ValidateEmailAddressInput = {
      emailAddress: '',
    };

    const result = await validateEmailAddress(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedEmailAddress).toBe(null);
    expect(result.errorCode).toBe('EMAIL_NOT_PROVIDED');
  });

  test('should return INVALID_EMAIL_FORMAT error when @ symbol is missing', async () => {
    const input: ValidateEmailAddressInput = {
      emailAddress: 'user.example.com',
    };

    const result = await validateEmailAddress(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedEmailAddress).toBe(null);
    expect(result.errorCode).toBe('INVALID_EMAIL_FORMAT');
  });

  test('should return INVALID_EMAIL_FORMAT error when multiple @ symbols', async () => {
    const input: ValidateEmailAddressInput = {
      emailAddress: 'user@example@com',
    };

    const result = await validateEmailAddress(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedEmailAddress).toBe(null);
    expect(result.errorCode).toBe('INVALID_EMAIL_FORMAT');
  });

  test('should return INVALID_EMAIL_FORMAT error when local part is empty', async () => {
    const input: ValidateEmailAddressInput = {
      emailAddress: '@example.com',
    };

    const result = await validateEmailAddress(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedEmailAddress).toBe(null);
    expect(result.errorCode).toBe('INVALID_EMAIL_FORMAT');
  });

  test('should return INVALID_EMAIL_FORMAT error when domain part is empty', async () => {
    const input: ValidateEmailAddressInput = {
      emailAddress: 'user@',
    };

    const result = await validateEmailAddress(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedEmailAddress).toBe(null);
    expect(result.errorCode).toBe('INVALID_EMAIL_FORMAT');
  });

  test('should return INVALID_EMAIL_FORMAT error when domain has no dot', async () => {
    const input: ValidateEmailAddressInput = {
      emailAddress: 'user@example',
    };

    const result = await validateEmailAddress(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedEmailAddress).toBe(null);
    expect(result.errorCode).toBe('INVALID_EMAIL_FORMAT');
  });

  test('should return INVALID_EMAIL_FORMAT error when TLD is too short', async () => {
    const input: ValidateEmailAddressInput = {
      emailAddress: 'user@example.c',
    };

    const result = await validateEmailAddress(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedEmailAddress).toBe(null);
    expect(result.errorCode).toBe('INVALID_EMAIL_FORMAT');
  });

  test('should return INVALID_EMAIL_FORMAT error when forbidden special character is used', async () => {
    const input: ValidateEmailAddressInput = {
      emailAddress: 'user#name@example.com',
    };

    const result = await validateEmailAddress(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedEmailAddress).toBe(null);
    expect(result.errorCode).toBe('INVALID_EMAIL_FORMAT');
  });
});
