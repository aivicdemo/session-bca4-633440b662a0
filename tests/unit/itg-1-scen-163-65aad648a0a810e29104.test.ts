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
      isValid: true,
      validatedEmailAddress: input.emailAddress,
      errorCode: null,
    })),
  };
});

describe('SCEN-163: 既存ユーザーマスタが空リストの場合、入力メールアドレスが有効であれば重複なしと判定する', () => {
  it('should return no duplicate when existingUserEmails is empty and email is valid', () => {
    const input: DetectDuplicateEmailAddressInput = {
      emailAddress: 'user@example.com',
      excludeUserId: undefined,
      existingUserEmails: [],
    };

    const result: DetectDuplicateEmailAddressOutput = detectDuplicateEmailAddress(input);

    expect(result.isDuplicate).toBe(false);
    expect(result.validatedEmailAddress).toBe('user@example.com');
    expect(result.errorCode).toBeNull();
  });
});
