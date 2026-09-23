import {
  detectDuplicateEmailAddress,
  validateEmailAddress,
  InvalidEmailAddressFormatError,
} from '../../src/logic/input-validation-formatting';

describe('SCEN-160: 入力メールアドレスが RFC 5322形式に違反している場合、形式エラーを返す', () => {
  test('RFC 5322 形式に違反するメールアドレスが入力された場合、形式エラーが返される', () => {
    const validateEmailAddressStub = jest.fn(() => ({
      isValid: false,
      validatedEmailAddress: null,
      errorCode: 'InvalidEmailAddressFormatError',
    }));

    const input = {
      emailAddress: 'invalid.email@',
      excludeUserId: undefined,
      existingUserEmails: ['user1@example.com', 'user2@example.com'],
    };

    const result = detectDuplicateEmailAddress(
      input,
      validateEmailAddressStub
    );

    expect(result.isDuplicate).toBe(false);
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.errorCode).toBe('InvalidEmailAddressFormatError');
  });

  test('形式エラーの場合、正しいエラー文言が返される', () => {
    const validateEmailAddressStub = jest.fn(() => ({
      isValid: false,
      validatedEmailAddress: null,
      errorCode: 'InvalidEmailAddressFormatError',
    }));

    const input = {
      emailAddress: '@domain.com',
      excludeUserId: undefined,
      existingUserEmails: ['user1@example.com', 'user2@example.com'],
    };

    const result = detectDuplicateEmailAddress(
      input,
      validateEmailAddressStub
    );

    expect(result.errorMessage).toBe('メールアドレスの形式が正しくありません。');
  });

  test('複数の形式違反パターンでエラーが返される', () => {
    const validateEmailAddressStub = jest.fn(() => ({
      isValid: false,
      validatedEmailAddress: null,
      errorCode: 'InvalidEmailAddressFormatError',
    }));

    const invalidEmails = ['invalid.email@', 'user@domain', '@domain.com'];

    invalidEmails.forEach(email => {
      const input = {
        emailAddress: email,
        excludeUserId: undefined,
        existingUserEmails: ['user1@example.com', 'user2@example.com'],
      };

      const result = detectDuplicateEmailAddress(
        input,
        validateEmailAddressStub
      );

      expect(result.errorCode).toBe('InvalidEmailAddressFormatError');
      expect(result.validatedEmailAddress).toBeNull();
    });
  });
});
