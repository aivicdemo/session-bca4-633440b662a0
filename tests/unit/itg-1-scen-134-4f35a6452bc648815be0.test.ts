import { validateEmailAddress, InvalidEmailFormatError } from '../../src/logic/input-validation-formatting';

describe('SCEN-134: ドメイン部分に.が含まれていない場合、INVALID_EMAIL_FORMAT エラーが返される', () => {
  test('ドメイン部分にドットがないメールアドレスでエラーが返される', () => {
    const input = { emailAddress: 'user@nodomain' };
    const result = validateEmailAddress(input);
    expect(result.isValid).toBe(false);
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.errorCode).toBe('INVALID_EMAIL_FORMAT');
  });

  test('InvalidEmailFormatErrorが発生し、エラー文言が正しい', () => {
    const input = { emailAddress: 'user@nodomain' };
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
