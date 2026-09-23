import {
  validateUserInformationRequired,
  validateEmailAddress,
  UserEmailAddressEmptyError,
} from '../../src/logic/input-validation-formatting';

describe('SCEN-157: チームリーダーが入力したメールアドレスがシステムに既に登録されている場合、このメールアドレスは既に使用されていますという指定文言で警告になる', () => {
  test('既に登録されているメールアドレスが入力された場合、重複エラーが返される', () => {
    const validateEmailAddressStub = jest.fn(() => ({
      isValid: true,
      validatedEmailAddress: 'existing@example.com',
      errorCode: null,
    }));

    const input = {
      userName: '田中太郎',
      emailAddress: 'existing@example.com',
      department: '営業部',
      maximumUserNameLength: 100,
      maximumDepartmentLength: 100,
    };

    const result = validateUserInformationRequired(
      input,
      validateEmailAddressStub,
      ['existing@example.com']
    );

    expect(result.isValid).toBe(false);
    expect(result.validatedUserName).toBe('田中太郎');
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.validatedDepartment).toBe('営業部');
    expect(result.errorCode).toBe('UserEmailAddressEmptyError');
    expect(result.errorDetails).toContainEqual(
      expect.objectContaining({
        field: 'emailAddress',
      })
    );
  });

  test('既に登録されているメールアドレスの場合、正しいエラー文言が返される', () => {
    const validateEmailAddressStub = jest.fn(() => ({
      isValid: true,
      validatedEmailAddress: 'existing@example.com',
      errorCode: null,
    }));

    const input = {
      userName: '田中太郎',
      emailAddress: 'existing@example.com',
      department: '営業部',
      maximumUserNameLength: 100,
      maximumDepartmentLength: 100,
    };

    const result = validateUserInformationRequired(
      input,
      validateEmailAddressStub,
      ['existing@example.com']
    );

    expect(result.errorMessage).toBe('このメールアドレスは既に使用されています');
  });
});
