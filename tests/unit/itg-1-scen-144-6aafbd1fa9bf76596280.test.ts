import {
  validateUserInformationRequired,
  ValidateUserInformationRequiredInput,
  ValidateUserInformationRequiredOutput,
} from '../../src/logic/input-validation-formatting';

jest.mock('../../src/logic/input-validation-formatting', () => {
  const actual = jest.requireActual('../../src/logic/input-validation-formatting');
  return {
    ...actual,
    validateEmailAddress: jest.fn((input) => ({
      isValid: true,
      validatedEmailAddress: input.emailAddress,
      errorCode: null,
    })),
  };
});

describe('SCEN-144: メールアドレスフィールドがnull・undefined・空白のみの場合、UserEmailAddressEmptyErrorが発生してメールアドレスの確定値がnullになる', () => {
  test('emailAddress=nullを設定した場合、UserEmailAddressEmptyErrorが発生してメールアドレスの確定値がnullになる', () => {
    const input: ValidateUserInformationRequiredInput = {
      userName: '田中太郎',
      emailAddress: null,
      department: '営業部',
      maximumUserNameLength: 100,
      maximumDepartmentLength: 100,
    };

    const result: ValidateUserInformationRequiredOutput = validateUserInformationRequired(input);

    // 関数が以下の値を返すこと
    expect(result.isValid).toBe(false);
    expect(result.validatedUserName).toBe('田中太郎');
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.validatedDepartment).toBe('営業部');
    expect(result.errorCode).toBe('UserEmailAddressEmptyError');
    // errorDetails配列に{field:'emailAddress', errorCode:'UserEmailAddressEmptyError'}が含まれること
    expect(result.errorDetails).toContainEqual({
      field: 'emailAddress',
      errorCode: 'UserEmailAddressEmptyError',
    });
  });
});
