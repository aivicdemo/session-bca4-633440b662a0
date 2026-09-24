import { validateEmailAddress, ValidateEmailAddressInput, ValidateEmailAddressOutput } from '../../src/logic/input-validation-formatting';

describe('SCEN-124: エラー：メールアドレスが入力されていない場合、EMAIL_NOT_PROVIDED エラーが返される', () => {
  it('nullを入力したとき、errorCodeがEMAIL_NOT_PROVIDEDである', () => {
    const input: ValidateEmailAddressInput = {
      emailAddress: null,
    };

    const result: ValidateEmailAddressOutput = validateEmailAddress(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.errorCode).toBe('EMAIL_NOT_PROVIDED');
  });
});
