import { detectDuplicateEmailAddress } from '../../src/logic/input-validation-formatting';

describe('SCEN-164: 報告者が入力したメールアドレスが空文字列の場合、入力なしエラーを発生させる', () => {
  it('emailAddressが空文字列の場合、EmailAddressNotProvidedErrorエラーコードが返される', async () => {
    const result = await detectDuplicateEmailAddress({
      emailAddress: '',
      excludeUserId: undefined,
      existingUserEmails: ['user1@example.com', 'user2@example.com']
    });

    expect(result.errorCode).toBe('EmailAddressNotProvidedError');
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.isDuplicate).toBe(false);
  });
});
