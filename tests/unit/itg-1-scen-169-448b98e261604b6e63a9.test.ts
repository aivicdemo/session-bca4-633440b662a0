import { describe, it, expect } from '@jest/globals';
import { detectDuplicateEmailAddress } from '../../src/logic/input-validation-formatting';

describe('SCEN-169: メールアドレスが空または不正な形式の場合、入力エラーを発生させる', () => {
  it('should return EmailAddressNotProvidedError when emailAddress is null', () => {
    // Arrange
    const existingUserEmails = ['user1@example.com', 'user2@example.com'];

    // Act
    const result = detectDuplicateEmailAddress({
      emailAddress: null,
      excludeUserId: undefined,
      existingUserEmails,
    });

    // Assert
    expect(result.errorCode).toBe('EmailAddressNotProvidedError');
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.isDuplicate).toBe(false);
  });

  it('should return EmailAddressNotProvidedError when emailAddress is undefined', () => {
    // Arrange
    const existingUserEmails = ['user1@example.com', 'user2@example.com'];

    // Act
    const result = detectDuplicateEmailAddress({
      emailAddress: undefined,
      excludeUserId: undefined,
      existingUserEmails,
    });

    // Assert
    expect(result.errorCode).toBe('EmailAddressNotProvidedError');
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.isDuplicate).toBe(false);
  });

  it('should return EmailAddressNotProvidedError when emailAddress is empty string', () => {
    // Arrange
    const existingUserEmails = ['user1@example.com', 'user2@example.com'];

    // Act
    const result = detectDuplicateEmailAddress({
      emailAddress: '',
      excludeUserId: undefined,
      existingUserEmails,
    });

    // Assert
    expect(result.errorCode).toBe('EmailAddressNotProvidedError');
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.isDuplicate).toBe(false);
  });

  it('should return InvalidEmailAddressFormatError when emailAddress has invalid format', () => {
    // Arrange
    const existingUserEmails = ['user1@example.com', 'user2@example.com'];

    // Act
    const result = detectDuplicateEmailAddress({
      emailAddress: 'invalid-email-format',
      excludeUserId: undefined,
      existingUserEmails,
    });

    // Assert
    expect(result.errorCode).toBe('InvalidEmailAddressFormatError');
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.isDuplicate).toBe(false);
  });

  it('should return InvalidEmailAddressFormatError when emailAddress lacks TLD', () => {
    // Arrange
    const existingUserEmails = ['user1@example.com', 'user2@example.com'];

    // Act
    const result = detectDuplicateEmailAddress({
      emailAddress: 'user@domain',
      excludeUserId: undefined,
      existingUserEmails,
    });

    // Assert
    expect(result.errorCode).toBe('InvalidEmailAddressFormatError');
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.isDuplicate).toBe(false);
  });
});
