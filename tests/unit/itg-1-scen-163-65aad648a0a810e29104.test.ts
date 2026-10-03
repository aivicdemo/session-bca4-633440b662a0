import { detectDuplicateEmailAddress } from '../../src/logic/input-validation-formatting';

describe('SCEN-163: 既存ユーザーマスタが空リストの場合、入力メールアドレスが有効であれば重複なしと判定する', () => {
  it('existingUserEmailsが空リストの場合、有効なメールアドレスは重複なしと判定される', async () => {
    const result = await detectDuplicateEmailAddress({
      emailAddress: 'user@example.com',
      excludeUserId: undefined,
      existingUserEmails: []
    });

    expect(result.isDuplicate).toBe(false);
    expect(result.validatedEmailAddress).toBe('user@example.com');
    expect(result.errorCode).toBeNull();
  });
});
