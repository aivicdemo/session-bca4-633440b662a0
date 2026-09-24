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
      isValid: false,
      validatedEmailAddress: null,
      errorCode: 'UserEmailAddressFormatInvalidError',
    })),
  };
});

describe('SCEN-145: メールアドレスがRFC 5322準拠でない形式の場合、UserEmailAddressFormatInvalidErrorが発生してメールアドレスの確定値がnullになる', () => {
  test('RFC 5322準拠でないメールアドレスを設定した場合、UserEmailAddressFormatInvalidErrorが発生してメールアドレスの確定値がnullになる', () => {
    const input: ValidateUserInformationRequiredInput = {
      userName: '田中太郎',
      emailAddress: 'invalid..email@example.com',
      department: '営業部',
      maximumUserNameLength: 100,
      maximumDepartmentLength: 100,
    };

    // validateEmailAddressをスタブ化し、メールアドレス'invalid..email@example.com'に対して
    // UserEmailAddressFormatInvalidErrorを発生させる

    const result: ValidateUserInformationRequiredOutput = validateUserInformationRequired(input);

    // 戻り値の出力型ValidateUserInformationRequiredOutputが以下を満たす
    expect(result.isValid).toBe(false);
    expect(result.validatedUserName).toBe('田中太郎');
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.validatedDepartment).toBe('営業部');
    expect(result.errorCode).toBe('UserEmailAddressFormatInvalidError');
    // エラー文言「メールアドレスの形式が正しくありません。」が設定されていることを確認する
    // errorDetailsにfield='emailAddress', errorCode='UserEmailAddressFormatInvalidError'が記録されていることを確認する
    expect(result.errorDetails).toContainEqual({
      field: 'emailAddress',
      errorCode: 'UserEmailAddressFormatInvalidError',
    });
  });
});
