jest.mock('../../src/logic/input-validation-formatting', () => {
  const actual = jest.requireActual('../../src/logic/input-validation-formatting');
  return {
    ...actual,
    validateEmailAddress: jest.fn(),
    detectDuplicateEmailAddress: jest.fn(),
  };
});

import {
  validateUserInformationRequired,
  validateEmailAddress,
  detectDuplicateEmailAddress,
  ValidateUserInformationRequiredInput,
  ValidateUserInformationRequiredOutput,
} from '../../src/logic/input-validation-formatting';

const mockedValidateEmailAddress = validateEmailAddress as jest.Mock;
const mockedDetectDuplicateEmailAddress = detectDuplicateEmailAddress as jest.Mock;

describe('SCEN-157: チームリーダーが入力したメールアドレスがシステムに既に登録されている場合、このメールアドレスは既に使用されていますという指定文言で警告になる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedValidateEmailAddress.mockReturnValue({
      isValid: true,
      validatedEmailAddress: 'existing@example.com',
      errorCode: null,
    });
    mockedDetectDuplicateEmailAddress.mockReturnValue({
      isDuplicate: true,
      validatedEmailAddress: 'existing@example.com',
      errorCode: 'DuplicateEmailAddressError',
    });
  });

  test('should return duplicate error when email is already registered', () => {
    const input: ValidateUserInformationRequiredInput = {
      userName: '田中太郎',
      emailAddress: 'existing@example.com',
      department: '営業部',
      maximumUserNameLength: 100,
      maximumDepartmentLength: 100,
    };

    const result: ValidateUserInformationRequiredOutput = validateUserInformationRequired(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedUserName).toBe('田中太郎');
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.validatedDepartment).toBe('営業部');
  });
});
