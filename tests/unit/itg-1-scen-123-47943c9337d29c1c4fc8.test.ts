import { describe, it, expect } from '@jest/globals';
import { validateEmailAddress, type ValidateEmailAddressInput, type ValidateEmailAddressOutput } from '../../src/logic/input-validation-formatting';

describe('SCEN-123: エラー：メールアドレスがRFC 5322に準拠していない場合、INVALID_EMAIL_FORMAT エラーが返される', () => {
  const invalidEmailCases = [
    { emailAddress: '', description: '空文字列' },
    { emailAddress: 'user.example.com', description: '@記号がない形式' },
    { emailAddress: 'user@example@com', description: '@記号が複数含まれる形式' },
    { emailAddress: '@example.com', description: 'ローカル部が空の形式' },
    { emailAddress: 'user@', description: 'ドメイン部が空の形式' },
    { emailAddress: 'user@example', description: 'ドメイン部にドットがない形式' },
    { emailAddress: 'user@example.c', description: 'トップレベルドメインが1文字の形式' },
    { emailAddress: 'user#name@example.com', description: '許可されていない特殊文字を含む形式' },
  ];

  invalidEmailCases.forEach(({ emailAddress, description }) => {
    it(`${description}を入力したとき、errorCodeがINVALID_EMAIL_FORMATである`, async () => {
      const input: ValidateEmailAddressInput = {
        emailAddress: emailAddress,
      };

      const result: ValidateEmailAddressOutput = await validateEmailAddress(input);

      expect(result.isValid).toBe(false);
      expect(result.validatedEmailAddress).toBe(null);
      expect(result.errorCode).toBe('INVALID_EMAIL_FORMAT');
    });
  });

  it('nullを入力したとき、errorCodeがINVALID_EMAIL_FORMATである', async () => {
    const input: ValidateEmailAddressInput = {
      emailAddress: null,
    };

    const result: ValidateEmailAddressOutput = await validateEmailAddress(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedEmailAddress).toBe(null);
    expect(result.errorCode).toBe('INVALID_EMAIL_FORMAT');
  });

  it('undefinedを入力したとき、errorCodeがINVALID_EMAIL_FORMATである', async () => {
    const input: ValidateEmailAddressInput = {
      emailAddress: undefined,
    };

    const result: ValidateEmailAddressOutput = await validateEmailAddress(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedEmailAddress).toBe(null);
    expect(result.errorCode).toBe('INVALID_EMAIL_FORMAT');
  });
});
