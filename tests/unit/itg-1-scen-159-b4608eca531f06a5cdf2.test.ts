import {
  detectDuplicateEmailAddress,
  validateEmailAddress,
  DuplicateEmailAddressError,
} from '../../src/logic/input-validation-formatting';

describe('SCEN-159: 入力メールアドレスが既存ユーザーに1件以上重複している場合、重複エラーを返す', () => {
  test('既存ユーザーに重複するメールアドレスが入力された場合、重複エラーが返される', () => {
    const validateEmailAddressStub = jest.fn(() => ({
      isValid: true,
      validatedEmailAddress: 'user@example.com',
      errorCode: null,
    }));

    const input = {
      emailAddress: 'user@example.com',
      excludeUserId: undefined,
      existingUserEmails: ['admin@example.com', 'user@example.com', 'leader@example.com'],
    };

    const result = detectDuplicateEmailAddress(
      input,
      validateEmailAddressStub
    );

    expect(result.isDuplicate).toBe(true);
    expect(result.validatedEmailAddress).toBe('user@example.com');
    expect(result.errorCode).toBeNull();
  });

  test('重複するメールアドレスの場合、正しいエラー文言を含むことを確認', () => {
    const validateEmailAddressStub = jest.fn(() => ({
      isValid: true,
      validatedEmailAddress: 'user@example.com',
      errorCode: null,
    }));

    const input = {
      emailAddress: 'user@example.com',
      excludeUserId: undefined,
      existingUserEmails: ['admin@example.com', 'user@example.com', 'leader@example.com'],
    };

    const result = detectDuplicateEmailAddress(
      input,
      validateEmailAddressStub
    );

    expect(result.errorMessage).toBe('このメールアドレスは既に登録されています。別のメールアドレスを入力してください。');
  });
});
