import { describe, it, expect } from '@jest/globals';
import { detectDuplicateEmailAddress } from '../../src/logic/input-validation-formatting';

describe('SCEN-168: 新規登録時に同じメールアドレスが既に登録されている場合、重複エラーを発生させる', () => {
  it('should return DuplicateEmailAddressError when email is already registered', () => {
    // Arrange
    const emailAddress = 'user1@example.com';
    const excludeUserId = undefined; // 新規登録時のため除外対象なし
    const existingUserEmails = [
      'admin@example.com',
      'user1@example.com',
      'leader@example.com',
    ];

    // Act
    const result = detectDuplicateEmailAddress({
      emailAddress,
      excludeUserId,
      existingUserEmails,
    });

    // Assert
    // isDuplicate が true である
    expect(result.isDuplicate).toBe(true);
    // validatedEmailAddress が正規化されたメールアドレス
    expect(result.validatedEmailAddress).toBe('user1@example.com');
    // errorCode が 'DuplicateEmailAddressError' である
    expect(result.errorCode).toBe('DuplicateEmailAddressError');
  });
});
