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

describe('SCEN-151: 報告者が入力した名前が空白のみで構成されている場合、trimして長さ判定により名前が不正と判断される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedValidateEmailAddress.mockReturnValue({
      isValid: true,
      validatedEmailAddress: 'user@example.com',
      errorCode: null,
    });
  });

  test('should return UserNameEmptyError when userName is whitespace only', () => {
    const input: ValidateUserInformationRequiredInput = {
      userName: '   ',
      emailAddress: 'user@example.com',
      department: '営業部',
    };

    const result: ValidateUserInformationRequiredOutput = validateUserInformationRequired(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedUserName).toBeNull();
    expect(result.validatedEmailAddress).toBe('user@example.com');
    expect(result.validatedDepartment).toBe('営業部');
    expect(result.errorCode).toBe('UserNameEmptyError');
    expect(result.errorDetails).toContainEqual({
      field: 'userName',
      errorCode: 'UserNameEmptyError',
    });
  });
});
