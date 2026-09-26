jest.mock('../../src/logic/input-validation-formatting', () => {
  const actual = jest.requireActual('../../src/logic/input-validation-formatting');
  return {
    ...actual,
    validateEmailAddress: jest.fn(),
  };
});

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  validateUserInformationRequired,
  validateEmailAddress,
  ValidateUserInformationRequiredInput,
  ValidateUserInformationRequiredOutput,
} from '../../src/logic/input-validation-formatting';

const mockedValidateEmailAddress = validateEmailAddress as jest.MockedFunction<any>;

describe('SCEN-152: 報告者が名前フィールドを空のまま送信しようとした場合、名前は必ず入力してくださいという指定文言でエラーになる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedValidateEmailAddress.mockReturnValue({
      isValid: true,
      validatedEmailAddress: 'user@example.com',
      errorCode: null,
    });
  });

  it('should return UserNameEmptyError when userName is empty string', async () => {
    const input: ValidateUserInformationRequiredInput = {
      userName: '',
      emailAddress: 'user@example.com',
      department: '営業部',
    };

    const result: ValidateUserInformationRequiredOutput = await validateUserInformationRequired(input);

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
