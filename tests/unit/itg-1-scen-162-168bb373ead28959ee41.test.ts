import {
  detectDuplicateEmailAddress,
  validateEmailAddress,
} from '../../src/logic/input-validation-formatting';

describe('SCEN-162: 既存ユーザー編集時に、編集対象ユーザーの現在のメールアドレスを excludeUserId で除外して検査すると、同じアドレスでも重複と判定されない', () => {
  test('excludeUserId で指定されたユーザーのメールアドレスは重複から除外される', () => {
    const validateEmailAddressStub = jest.fn(() => ({
      isValid: true,
      validatedEmailAddress: 'user2@example.com',
      errorCode: null,
    }));

    const input = {
      emailAddress: 'user2@example.com',
      excludeUserId: 'user-002',
      existingUserEmails: ['user1@example.com', 'user2@example.com', 'user3@example.com'],
    };

    const result = detectDuplicateEmailAddress(
      input,
      validateEmailAddressStub
    );

    expect(result.isDuplicate).toBe(false);
    expect(result.validatedEmailAddress).toBe('user2@example.com');
    expect(result.errorCode).toBeNull();
  });

  test('excludeUserId のないユーザーのメールアドレスは重複として判定される', () => {
    const validateEmailAddressStub = jest.fn(() => ({
      isValid: true,
      validatedEmailAddress: 'user2@example.com',
      errorCode: null,
    }));

    const input = {
      emailAddress: 'user2@example.com',
      excludeUserId: undefined,
      existingUserEmails: ['user1@example.com', 'user2@example.com', 'user3@example.com'],
    };

    const result = detectDuplicateEmailAddress(
      input,
      validateEmailAddressStub
    );

    expect(result.isDuplicate).toBe(true);
  });

  test('既存ユーザー編集時に、異なるメールアドレスを入力した場合、重複がなければ重複なしと判定される', () => {
    const validateEmailAddressStub = jest.fn(() => ({
      isValid: true,
      validatedEmailAddress: 'newemail@example.com',
      errorCode: null,
    }));

    const input = {
      emailAddress: 'newemail@example.com',
      excludeUserId: 'user-002',
      existingUserEmails: ['user1@example.com', 'user2@example.com', 'user3@example.com'],
    };

    const result = detectDuplicateEmailAddress(
      input,
      validateEmailAddressStub
    );

    expect(result.isDuplicate).toBe(false);
    expect(result.validatedEmailAddress).toBe('newemail@example.com');
  });

  test('validateEmailAddress スタブがメールアドレスを正規化して返すことを確認', () => {
    const validateEmailAddressStub = jest.fn(() => ({
      isValid: true,
      validatedEmailAddress: 'user2@example.com',
      errorCode: null,
    }));

    const input = {
      emailAddress: 'user2@example.com',
      excludeUserId: 'user-002',
      existingUserEmails: ['user1@example.com', 'user2@example.com', 'user3@example.com'],
    };

    detectDuplicateEmailAddress(input, validateEmailAddressStub);

    expect(validateEmailAddressStub).toHaveBeenCalledWith(
      expect.objectContaining({
        emailAddress: 'user2@example.com',
      })
    );
  });
});
