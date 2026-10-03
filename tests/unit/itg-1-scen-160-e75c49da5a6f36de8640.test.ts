import { describe, it, expect } from '@jest/globals';
import {
  detectDuplicateEmailAddress,
  DetectDuplicateEmailAddressInput,
  DetectDuplicateEmailAddressOutput,
} from '../../src/logic/input-validation-formatting';

describe('SCEN-160: 入力メールアドレスが RFC 5322 形式に違反している場合、形式エラーを返す', () => {
  it('should return InvalidEmailAddressFormatError for RFC 5322 format violation: invalid.email@', async () => {
    const input: DetectDuplicateEmailAddressInput = {
      emailAddress: 'invalid.email@',
      excludeUserId: undefined,
      existingUserEmails: ['user1@example.com', 'user2@example.com'],
    };

    const result: DetectDuplicateEmailAddressOutput = await detectDuplicateEmailAddress(input);

    expect(result.isDuplicate).toBe(false);
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.errorCode).toBe('EmailAddressInvalidFormat');
  });

  it('should return InvalidEmailAddressFormatError for RFC 5322 format violation: user@domain', async () => {
    const input: DetectDuplicateEmailAddressInput = {
      emailAddress: 'user@domain',
      excludeUserId: undefined,
      existingUserEmails: ['user1@example.com', 'user2@example.com'],
    };

    const result: DetectDuplicateEmailAddressOutput = await detectDuplicateEmailAddress(input);

    expect(result.isDuplicate).toBe(false);
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.errorCode).toBe('EmailAddressInvalidFormat');
  });

  it('should return InvalidEmailAddressFormatError for RFC 5322 format violation: @domain.com', async () => {
    const input: DetectDuplicateEmailAddressInput = {
      emailAddress: '@domain.com',
      excludeUserId: undefined,
      existingUserEmails: ['user1@example.com', 'user2@example.com'],
    };

    const result: DetectDuplicateEmailAddressOutput = await detectDuplicateEmailAddress(input);

    expect(result.isDuplicate).toBe(false);
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.errorCode).toBe('EmailAddressInvalidFormat');
  });
});
