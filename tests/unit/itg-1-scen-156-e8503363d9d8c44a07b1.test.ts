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

describe('SCEN-156: チームリーダーが所属が空の状態で検証した場合、所属を選択してくださいという指定文言でエラーになる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedValidateEmailAddress.mockReturnValue({
      isValid: true,
      validatedEmailAddress: 'taro@example.com',
      errorCode: null,
    });
  });

  test('should return UserDepartmentEmptyError when department is null', () => {
    const input: ValidateUserInformationRequiredInput = {
      userName: '田中太郎',
      emailAddress: 'taro@example.com',
      department: null,
    };

    const result: ValidateUserInformationRequiredOutput = validateUserInformationRequired(input);

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
});
