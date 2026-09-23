import { validateEmailAddress, InvalidEmailFormatError } from '../../src/logic/input-validation-formatting';

describe('SCEN-135: トップレベルドメインが1文字の場合、INVALID_EMAIL_FORMAT エラーが返される', () => {
  test('トップレベルドメインが1文字のメールアドレスでエラーが返される', () => {
    const input = { emailAddress: 'user@a.x' };
    const result = validateEmailAddress(input);
    expect(result.isValid).toBe(false);
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.errorCode).toBe('INVALID_EMAIL_FORMAT');
  });

  test('InvalidEmailFormatErrorが発生し、エラー文言が正しい', () => {
    const input = { emailAddress: 'user@a.x' };
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
