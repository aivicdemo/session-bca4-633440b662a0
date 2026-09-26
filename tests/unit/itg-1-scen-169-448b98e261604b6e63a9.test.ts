import { describe, it, expect } from '@jest/globals';
import { detectDuplicateEmailAddress, type DetectDuplicateEmailAddressOutput } from '../../src/logic/input-validation-formatting';

describe('SCEN-169: メールアドレスが空または不正な形式の場合、入力エラーを発生させる', () => {
  it('step 1: should return EmailAddressNotProvidedError when emailAddress is null', async () => {
    // Arrange
    const existingUserEmails = ['user1@example.com', 'user2@example.com'];

    // Act
    const result = (await Promise.resolve(detectDuplicateEmailAddress({
      emailAddress: null,
      excludeUserId: undefined,
      existingUserEmails,
    }))) as DetectDuplicateEmailAddressOutput;

    // Assert: ステップ1の場合
    expect(result.errorCode).toBe('EmailAddressEmpty');
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.isDuplicate).toBe(false);
  });

  it('step 2: should return EmailAddressNotProvidedError when emailAddress is undefined', async () => {
    // Arrange
    const existingUserEmails = ['user1@example.com', 'user2@example.com'];

    // Act
    const result = (await Promise.resolve(detectDuplicateEmailAddress({
      emailAddress: undefined,
      excludeUserId: undefined,
      existingUserEmails,
    }))) as DetectDuplicateEmailAddressOutput;

    // Assert: ステップ2の場合
    expect(result.errorCode).toBe('EmailAddressEmpty');
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.isDuplicate).toBe(false);
  });

  it('step 3: should return EmailAddressNotProvidedError when emailAddress is empty string', async () => {
    // Arrange
    const existingUserEmails = ['user1@example.com', 'user2@example.com'];

    // Act
    const result = (await Promise.resolve(detectDuplicateEmailAddress({
      emailAddress: '',
      excludeUserId: undefined,
      existingUserEmails,
    }))) as DetectDuplicateEmailAddressOutput;

    // Assert: ステップ3の場合
    expect(result.errorCode).toBe('EmailAddressEmpty');
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.isDuplicate).toBe(false);
  });

  it('step 4: should return InvalidEmailAddressFormatError when emailAddress has invalid format', async () => {
    // Arrange
    const existingUserEmails = ['user1@example.com', 'user2@example.com'];

    // Act
    const result = (await Promise.resolve(detectDuplicateEmailAddress({
      emailAddress: 'invalid-email-format',
      excludeUserId: undefined,
      existingUserEmails,
    }))) as DetectDuplicateEmailAddressOutput;

    // Assert: ステップ4の場合
    expect(result.errorCode).toBe('EmailAddressInvalidFormat');
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.isDuplicate).toBe(false);
  });

  it('step 5: should return InvalidEmailAddressFormatError when emailAddress lacks TLD', async () => {
    // Arrange
    const existingUserEmails = ['user1@example.com', 'user2@example.com'];

    // Act
    const result = (await Promise.resolve(detectDuplicateEmailAddress({
      emailAddress: 'user@domain',
      excludeUserId: undefined,
      existingUserEmails,
    }))) as DetectDuplicateEmailAddressOutput;

    // Assert: ステップ5の場合
    expect(result.errorCode).toBe('EmailAddressInvalidFormat');
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.isDuplicate).toBe(false);
  });
});
