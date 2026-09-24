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

describe('SCEN-154: チームリーダーが名前が空または空白のみの状態で検証した場合、名前を入力してくださいという指定文言でエラーになる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedValidateEmailAddress.mockReturnValue({
      isValid: true,
      validatedEmailAddress: 'test@example.com',
      errorCode: null,
    });
  });

  test('should return UserNameEmptyError when userName is empty string', () => {
    const input: ValidateUserInformationRequiredInput = {
      userName: '',
      emailAddress: 'test@example.com',
      department: '営業部',
    };

    const result: ValidateUserInformationRequiredOutput = validateUserInformationRequired(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedUserName).toBeNull();
    expect(result.errorCode).toBe('UserNameEmptyError');
    expect(result.errorDetails).toContainEqual({
      field: 'userName',
      errorCode: 'UserNameEmptyError',
    });
  });
});
