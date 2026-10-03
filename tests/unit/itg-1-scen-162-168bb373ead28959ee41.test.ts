import { detectDuplicateEmailAddress } from '../../src/logic/input-validation-formatting';

describe('SCEN-162: 既存ユーザー編集時に、編集対象ユーザーの現在のメールアドレスを excludeUserId で除外して検査すると、同じアドレスでも重複と判定されない', () => {
  it('excludeUserIdで指定されたユーザーのメールアドレスは重複と判定されない', async () => {
    const existingUserEmails = ['user1@example.com', 'user2@example.com', 'user3@example.com'];
    const emailAddress = 'user2@example.com';
    const excludeUserId = 'user-002';

    const result = await detectDuplicateEmailAddress({
      emailAddress,
      excludeUserId,
      existingUserEmails
    });

    expect(result.isDuplicate).toBe(false);
    expect(result.validatedEmailAddress).toBe('user2@example.com');
    expect(result.errorCode).toBeNull();
  });
});
