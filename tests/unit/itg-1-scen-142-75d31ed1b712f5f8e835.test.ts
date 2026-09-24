import {
  validateUserInformationRequired,
  validateEmailAddress,
  ValidateUserInformationRequiredInput,
  ValidateUserInformationRequiredOutput,
  ValidateEmailAddressOutput,
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

describe('SCEN-142: 必須3項目すべてが有効な値で入力された場合、検証が成功して全項目が確定される', () => {
  test('validateUserInformationRequired関数を有効なすべての必須項目で呼び出すと、isValidがtrueになり、すべての項目が確定される', () => {
    // validateEmailAddressスタブが呼び出された場合、emailAddress='tanaka.taro@example.com'に対して
    // RFC 5322形式として正当性を返す
    const input: ValidateUserInformationRequiredInput = {
      userName: '田中太郎',
      emailAddress: 'tanaka.taro@example.com',
      department: '営業部',
      maximumUserNameLength: 100,
      maximumDepartmentLength: 100,
    };

    const result: ValidateUserInformationRequiredOutput = validateUserInformationRequired(input);

    // 検証が成功して全項目が確定される
    expect(result.isValid).toBe(true);
    expect(result.validatedUserName).toBe('田中太郎');
    expect(result.validatedEmailAddress).toBe('tanaka.taro@example.com');
    expect(result.validatedDepartment).toBe('営業部');
    expect(result.errorCode).toBeNull();
    expect(result.errorDetails === undefined || result.errorDetails.length === 0).toBe(true);
  });
});
