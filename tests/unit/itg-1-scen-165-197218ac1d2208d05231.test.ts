import {
  detectDuplicateEmailAddress,
  DetectDuplicateEmailAddressInput,
  DetectDuplicateEmailAddressOutput,
} from '../../src/logic/input-validation-formatting';

jest.mock('../../src/logic/input-validation-formatting', () => {
  const actual = jest.requireActual('../../src/logic/input-validation-formatting');
  return {
    ...actual,
    validateEmailAddress: jest.fn((input) => ({
      isValid: false,
      validatedEmailAddress: null,
      errorCode: 'InvalidEmailAddressFormatError',
    })),
  };
});

describe('SCEN-165: 報告者が入力したメールアドレスが正しいメール形式でない場合、形式エラーを発生させる', () => {
  it('should return InvalidEmailAddressFormatError when emailAddress format is invalid', () => {
    const input: DetectDuplicateEmailAddressInput = {
      emailAddress: 'invalid-email-format',
      excludeUserId: undefined,
      existingUserEmails: ['user1@example.com', 'user2@example.com'],
    };

    const result: DetectDuplicateEmailAddressOutput = detectDuplicateEmailAddress(input);

    expect(result.isDuplicate).toBe(false);
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.errorCode).toBe('InvalidEmailAddressFormatError');
  });
});
