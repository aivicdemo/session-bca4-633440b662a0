import {
  detectDuplicateEmailAddress,
  DetectDuplicateEmailAddressInput,
  DetectDuplicateEmailAddressOutput,
} from '../../src/logic/input-validation-formatting';

jest.mock('../../src/logic/input-validation-formatting', () => {
  const actual = jest.requireActual('../../src/logic/input-validation-formatting');
  return {
    ...actual,
    validateEmailAddress: jest.fn((input) => {
      // RFC 5322形式に違反するメールアドレスの場合、形式エラーを返す
      const invalidPatterns = [/.*@$/, /^[^@]+@[^@]*$(?<!\.com)$/, /^@/];
      if (invalidPatterns.some((pattern) => pattern.test(input.emailAddress))) {
        return {
          isValid: false,
          validatedEmailAddress: null,
          errorCode: 'InvalidEmailAddressFormatError',
        };
      }
      return {
        isValid: true,
        validatedEmailAddress: input.emailAddress,
        errorCode: null,
      };
    }),
  };
});

describe('SCEN-160: 入力メールアドレスが RFC 5322 形式に違反している場合、形式エラーを返す', () => {
  it('should return InvalidEmailAddressFormatError for RFC 5322 format violation: invalid.email@', () => {
    const input: DetectDuplicateEmailAddressInput = {
      emailAddress: 'invalid.email@',
      excludeUserId: undefined,
      existingUserEmails: ['user1@example.com', 'user2@example.com'],
    };

    const result: DetectDuplicateEmailAddressOutput = detectDuplicateEmailAddress(input);

    expect(result.isDuplicate).toBe(false);
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.errorCode).toBe('InvalidEmailAddressFormatError');
  });

  it('should return InvalidEmailAddressFormatError for RFC 5322 format violation: user@domain', () => {
    const input: DetectDuplicateEmailAddressInput = {
      emailAddress: 'user@domain',
      excludeUserId: undefined,
      existingUserEmails: ['user1@example.com', 'user2@example.com'],
    };

    const result: DetectDuplicateEmailAddressOutput = detectDuplicateEmailAddress(input);

    expect(result.isDuplicate).toBe(false);
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.errorCode).toBe('InvalidEmailAddressFormatError');
  });

  it('should return InvalidEmailAddressFormatError for RFC 5322 format violation: @domain.com', () => {
    const input: DetectDuplicateEmailAddressInput = {
      emailAddress: '@domain.com',
      excludeUserId: undefined,
      existingUserEmails: ['user1@example.com', 'user2@example.com'],
    };

    const result: DetectDuplicateEmailAddressOutput = detectDuplicateEmailAddress(input);

    expect(result.isDuplicate).toBe(false);
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.errorCode).toBe('InvalidEmailAddressFormatError');
  });
});
