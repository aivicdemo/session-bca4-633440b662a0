import { describe, it, expect } from '@jest/globals';
import {
  detectDuplicateEmailAddress,
  DetectDuplicateEmailAddressInput,
  DetectDuplicateEmailAddressOutput,
} from '../../src/logic/input-validation-formatting';

describe('SCEN-159: 入力メールアドレスが既存ユーザーに1件以上重複している場合、重複エラーを返す', () => {
  it('should return duplicate error when email is already registered', async () => {
    const input: DetectDuplicateEmailAddressInput = {
      emailAddress: 'user@example.com',
      excludeUserId: undefined,
      existingUserEmails: ['admin@example.com', 'user@example.com', 'leader@example.com'],
    };

    const result: DetectDuplicateEmailAddressOutput = await detectDuplicateEmailAddress(input);

    expect(result.isDuplicate).toBe(true);
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.errorCode).toBe('DuplicateEmailAddress');
  });
});
