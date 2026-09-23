import {
  detectDuplicateEmailAddress,
  validateEmailAddress,
  EmailAddressNotProvidedError,
} from '../../src/logic/input-validation-formatting';

describe('SCEN-161: 入力メールアドレスが null、undefined、または空文字列の場合、未入力エラーを返す', () => {
  test('メールアドレスが null の場合、未入力エラーが返される', () => {
    const validateEmailAddressStub = jest.fn();

    const input = {
      emailAddress: null,
      excludeUserId: undefined,
      existingUserEmails: [],
    };

    const result = detectDuplicateEmailAddress(
      input,
      validateEmailAddressStub
    );

    expect(result.isDuplicate).toBe(false);
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.errorCode).toBe('EmailAddressNotProvidedError');
  });

  test('メールアドレスが undefined の場合、未入力エラーが返される', () => {
    const validateEmailAddressStub = jest.fn();

    const input = {
      emailAddress: undefined,
      excludeUserId: undefined,
      existingUserEmails: [],
    };

    const result = detectDuplicateEmailAddress(
      input,
      validateEmailAddressStub
    );

    expect(result.isDuplicate).toBe(false);
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.errorCode).toBe('EmailAddressNotProvidedError');
  });

  test('メールアドレスが空文字列の場合、未入力エラーが返される', () => {
    const validateEmailAddressStub = jest.fn();

    const input = {
      emailAddress: '',
      excludeUserId: undefined,
      existingUserEmails: [],
    };

    const result = detectDuplicateEmailAddress(
      input,
      validateEmailAddressStub
    );

    expect(result.isDuplicate).toBe(false);
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.errorCode).toBe('EmailAddressNotProvidedError');
  });

  test('未入力エラーの場合、正しいエラー文言が返される', () => {
    const validateEmailAddressStub = jest.fn();

    const input = {
      emailAddress: null,
      excludeUserId: undefined,
      existingUserEmails: [],
    };

    const result = detectDuplicateEmailAddress(
      input,
      validateEmailAddressStub
    );

    expect(result.errorMessage).toBe('メールアドレスを入力してください。');
  });
});
