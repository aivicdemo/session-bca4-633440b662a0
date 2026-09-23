import { describe, it, expect } from '@jest/globals';
import {
  validateEmailAddress,
  ValidateEmailAddressInput,
  ValidateEmailAddressOutput,
  InvalidEmailFormatError,
} from '../../src/logic/input-validation-formatting';

describe('SCEN-123: メールアドレスがRFC 5322に準拠していない場合、INVALID_EMAIL_FORMAT エラーが返される', () => {
  const invalidEmailFormats = [
    '',
    null,
    undefined,
    'user.example.com',
    'user@example@com',
    '@example.com',
    'user@',
    'user@example',
    'user@example.c',
    'user#name@example.com',
  ];

  invalidEmailFormats.forEach((invalidEmail) => {
    it(`RFC 5322 に準拠していないメールアドレス (${JSON.stringify(invalidEmail)}) が入力されたとき、INVALID_EMAIL_FORMAT エラーが返される`, async () => {
      const input: ValidateEmailAddressInput = {
        emailAddress: invalidEmail as any,
      };

      const result: ValidateEmailAddressOutput = await validateEmailAddress(input);

      expect(result.isValid).toBe(false);
      expect(result.validatedEmailAddress).toBeNull();
      expect(result.errorCode).toBe('INVALID_EMAIL_FORMAT');
    });
  });

  it('RFC 5322 に準拠していないメールアドレスが入力されたとき、InvalidEmailFormatError が発生する', async () => {
    const input: ValidateEmailAddressInput = {
      emailAddress: 'user@example@com',
    };

    await expect(async () => {
      await validateEmailAddress(input);
    }).rejects.toThrow(InvalidEmailFormatError);

    try {
      await validateEmailAddress(input);
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidEmailFormatError);
      expect((error as Error).message).toContain('メールアドレスの形式が正しくありません。正しい形式で入力してください。');
    }
  });
});
