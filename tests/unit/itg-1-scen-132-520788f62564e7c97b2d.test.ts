import { validateEmailAddress, InvalidEmailFormatError } from '../../src/logic/input-validation-formatting';

describe('SCEN-132: @の前の部分に不正な文字が含まれている場合、INVALID_EMAIL_FORMAT エラーが返される', () => {
  test('@の前に#を含むメールアドレスでエラーが返される', () => {
    const input = { emailAddress: 'user#@example.com' };
    const result = validateEmailAddress(input);
    expect(result.isValid).toBe(false);
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.errorCode).toBe('INVALID_EMAIL_FORMAT');
  });

  test('@の前に空白を含むメールアドレスでエラーが返される', () => {
    const input = { emailAddress: 'user name@example.com' };
    const result = validateEmailAddress(input);
    expect(result.isValid).toBe(false);
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.errorCode).toBe('INVALID_EMAIL_FORMAT');
  });

  test('@の前に!を含むメールアドレスでエラーが返される', () => {
    const input = { emailAddress: 'user!@example.com' };
    const result = validateEmailAddress(input);
    expect(result.isValid).toBe(false);
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.errorCode).toBe('INVALID_EMAIL_FORMAT');
  });

  test('InvalidEmailFormatErrorが発生し、エラー文言が正しい', () => {
    const input = { emailAddress: 'user@#example.com' };
    expect(() => validateEmailAddress(input)).toThrow(InvalidEmailFormatError);
    try {
      validateEmailAddress(input);
    } catch (error) {
      if (error instanceof InvalidEmailFormatError) {
        expect(error.message).toBe('メールアドレスの形式が正しくありません。正しい形式で入力してください。');
      }
    }
  });
});
