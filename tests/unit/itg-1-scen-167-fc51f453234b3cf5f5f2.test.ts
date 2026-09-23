import { describe, it, expect } from '@jest/globals';
import { detectDuplicateEmailAddress } from '../../src/logic/input-validation-formatting';

describe('SCEN-167: 登録または変更しようとするメールアドレスが一意であり、編集対象ユーザー自身は除外して判定する', () => {
  it('should detect duplicate email address and exclude the editing user', () => {
    // Arrange
    const emailAddress = 'user@example.com';
    const excludeUserId = 'user-002';
    const existingUserEmails = [
      'admin@example.com',
      'user@example.com',
      'leader@example.com',
    ];

    // Act
    const result = detectDuplicateEmailAddress({
      emailAddress,
      excludeUserId,
      existingUserEmails,
    });

    // Assert - 重複を検知する
    expect(result.isDuplicate).toBe(true);
    // 正規化されたメールアドレスを返す
    expect(result.validatedEmailAddress).toBe('user@example.com');
    // エラーはない
    expect(result.errorCode).toBeNull();
  });
});
