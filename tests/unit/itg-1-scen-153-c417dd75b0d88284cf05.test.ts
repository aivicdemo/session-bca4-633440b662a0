jest.mock('../../src/logic/input-validation-formatting', () => {
  const actual = jest.requireActual('../../src/logic/input-validation-formatting');
  return {
    ...actual,
    validateEmailAddress: jest.fn(),
  };
});

import {
  validateUserInformationRequired,
  validateEmailAddress,
  ValidateUserInformationRequiredInput,
  ValidateUserInformationRequiredOutput,
} from '../../src/logic/input-validation-formatting';

const mockedValidateEmailAddress = validateEmailAddress as jest.Mock;

describe('SCEN-153: チームリーダーが名前・メールアドレス・所属の形式と内容の検証を開始した場合、各項目の妥当性と全体の承認可否が判定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedValidateEmailAddress.mockReturnValue({
      isValid: true,
      validatedEmailAddress: 'tanaka@example.com',
      errorCode: null,
    });
  });

  test('should validate all required fields when correctly provided', () => {
    const input: ValidateUserInformationRequiredInput = {
      userName: '田中太郎',
      emailAddress: 'tanaka@example.com',
      department: '営業部',
    };

    const result: ValidateUserInformationRequiredOutput = validateUserInformationRequired(input);

    expect(result.isValid).toBe(true);
    expect(result.validatedUserName).toBe('田中太郎');
    expect(result.validatedEmailAddress).toBe('tanaka@example.com');
    expect(result.validatedDepartment).toBe('営業部');
    expect(result.errorCode).toBeNull();
    expect(result.errorDetails).toEqual([]);
  });
});
