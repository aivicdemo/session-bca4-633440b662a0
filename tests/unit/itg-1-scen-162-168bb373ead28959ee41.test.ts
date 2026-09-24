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

describe('SCEN-162: 既存ユーザー編集時に、編集対象ユーザーの現在のメールアドレスを excludeUserId で除外して検査すると、同じアドレスでも重複と判定されない', () => {
  it('should not report duplicate when editing user and email is excluded by userId', () => {
    const existingUserEmails = [
      'user1@example.com',
      'user2@example.com',
      'user3@example.com',
    ];
    const editTargetEmail = 'user2@example.com';
    const editTargetUserId = 'user-002';

    const input: DetectDuplicateEmailAddressInput = {
      emailAddress: editTargetEmail,
      excludeUserId: editTargetUserId,
      existingUserEmails,
    };

    const result: DetectDuplicateEmailAddressOutput = detectDuplicateEmailAddress(input);

    expect(result.isDuplicate).toBe(false);
    expect(result.validatedEmailAddress).toBe(editTargetEmail);
    expect(result.errorCode).toBeNull();
  });
});
