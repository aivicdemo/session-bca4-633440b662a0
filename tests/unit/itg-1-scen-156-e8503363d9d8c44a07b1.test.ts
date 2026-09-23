import {
  validateUserInformationRequired,
  validateEmailAddress,
  UserDepartmentEmptyError,
} from '../../src/logic/input-validation-formatting';

describe('SCEN-156: チームリーダーが所属が空の状態で検証した場合、所属を選択してくださいという指定文言でエラーになる', () => {
  test('所属が null の場合、所属を選択してくださいエラーが返される', () => {
    const validateEmailAddressStub = jest.fn(() => ({
      isValid: true,
      validatedEmailAddress: 'taro@example.com',
      errorCode: null,
    }));

    const input = {
      userName: '田中太郎',
      emailAddress: 'taro@example.com',
      department: null,
    };

    const result = validateUserInformationRequired(input, validateEmailAddressStub);

    expect(result.isValid).toBe(false);
    expect(result.validatedUserName).toBe('田中太郎');
    expect(result.validatedEmailAddress).toBe('taro@example.com');
    expect(result.validatedDepartment).toBeNull();
    expect(result.errorCode).toBe('UserDepartmentEmptyError');
    expect(result.errorDetails).toContainEqual({
      field: 'department',
      errorCode: 'UserDepartmentEmptyError',
    });
  });

  test('所属が空の場合、正しいエラー文言が返される', () => {
    const validateEmailAddressStub = jest.fn(() => ({
      isValid: true,
      validatedEmailAddress: 'taro@example.com',
      errorCode: null,
    }));

    const input = {
      userName: '田中太郎',
      emailAddress: 'taro@example.com',
      department: null,
    };

    const result = validateUserInformationRequired(input, validateEmailAddressStub);

    expect(result.errorMessage).toBe('所属を選択してください');
  });
});
