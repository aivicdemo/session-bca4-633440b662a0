import { describe, it, expect } from '@jest/globals';
import { detectDuplicateEmailAddress, type DetectDuplicateEmailAddressOutput } from '../../src/logic/input-validation-formatting';

describe('SCEN-168: 新規登録時に同じメールアドレスが既に登録されている場合、重複エラーを発生させる', () => {
  it('should return DuplicateEmailAddressError when email is already registered', async () => {
    // Arrange
    const emailAddress = 'user1@example.com';
    const excludeUserId = undefined;
    const existingUserEmails = [
      'admin@example.com',
      'user1@example.com',
      'leader@example.com',
    ];

    // Act
    const result = (await Promise.resolve(detectDuplicateEmailAddress({
      emailAddress,
      excludeUserId,
      existingUserEmails,
    }))) as DetectDuplicateEmailAddressOutput;

    // Assert
    expect(result.isDuplicate).toBe(true);
    expect(result.validatedEmailAddress).toBe('user1@example.com');
    expect(result.errorCode).toBeNull();
  });
});
