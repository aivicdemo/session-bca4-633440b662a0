import {
  detectDuplicateEmailAddress,
  validateEmailAddress,
} from '../../src/logic/input-validation-formatting';

describe('SCEN-158: 有効なメールアドレスが入力され、既存ユーザーに重複がない場合、正規化されたメールアドレスを返して重複なしと判定する', () => {
  test('有効でユニークなメールアドレスが入力された場合、重複なしで返される', () => {
    const validateEmailAddressStub = jest.fn(() => ({
      isValid: true,
      validatedEmailAddress: 'user@example.com',
      errorCode: null,
    }));

    const input = {
      emailAddress: 'user@example.com',
      excludeUserId: undefined,
      existingUserEmails: [],
    };

    const result = detectDuplicateEmailAddress(
      input,
      validateEmailAddressStub
    );

    expect(result.isDuplicate).toBe(false);
    expect(result.validatedEmailAddress).toBe('user@example.com');
    expect(result.errorCode).toBeNull();
  });

  test('入力したメールアドレスの正規化が実行されることを確認', () => {
    const validateEmailAddressStub = jest.fn(() => ({
      isValid: true,
      validatedEmailAddress: 'user@example.com',
      errorCode: null,
    }));

    const input = {
      emailAddress: 'user@example.com',
      excludeUserId: undefined,
      existingUserEmails: [],
    };

    detectDuplicateEmailAddress(input, validateEmailAddressStub);

    expect(validateEmailAddressStub).toHaveBeenCalledWith(
      expect.objectContaining({
        emailAddress: 'user@example.com',
      })
    );
  });
});
