jest.mock('../../src/logic/input-validation-formatting', () => {
  const actual = jest.requireActual('../../src/logic/input-validation-formatting');
  return {
    ...actual,
    validateEmailAddress: jest.fn(),
    detectDuplicateEmailAddress: jest.fn(),
  };
});

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  validateUserInformationRequired,
  validateEmailAddress,
  detectDuplicateEmailAddress,
  ValidateUserInformationRequiredInput,
  ValidateUserInformationRequiredOutput,
} from '../../src/logic/input-validation-formatting';

const mockedValidateEmailAddress = validateEmailAddress as jest.MockedFunction<any>;
const mockedDetectDuplicateEmailAddress = detectDuplicateEmailAddress as jest.MockedFunction<any>;

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

  it('should return error when email is already registered', async () => {
    const input: ValidateUserInformationRequiredInput = {
      userName: '田中太郎',
      emailAddress: 'existing@example.com',
      department: '営業部',
      maximumUserNameLength: 100,
    };

    const result: ValidateUserInformationRequiredOutput = await validateUserInformationRequired(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedUserName).toBe('田中太郎');
    expect(result.validatedEmailAddress).toBe('existing@example.com');
    expect(result.validatedDepartment).toBe('営業部');
  });
});
