import { validateEmailAddress, InvalidEmailFormatError } from '../../src/logic/input-validation-formatting';

describe('SCEN-133: @の後ろの部分が空の場合、INVALID_EMAIL_FORMAT エラーが返される', () => {
  test('@の後ろが空のメールアドレスでエラーが返される', () => {
    const input = { emailAddress: 'user@' };
    const result = validateEmailAddress(input);
    expect(result.isValid).toBe(false);
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.errorCode).toBe('INVALID_EMAIL_FORMAT');
  });

  test('InvalidEmailFormatErrorが発生し、エラー文言が正しい', () => {
    const input = { emailAddress: 'user@' };
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
