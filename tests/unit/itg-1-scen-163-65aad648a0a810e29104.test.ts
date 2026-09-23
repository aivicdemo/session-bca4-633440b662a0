import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import * as inputValidation from '../../src/logic/input-validation-formatting';

describe('SCEN-163: 既存ユーザーマスタが空リストの場合、入力メールアドレスが有効であれば重複なしと判定する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('validateEmailAddress がスタブ化され、入力メールアドレスが有効な形式の場合は正規化されたメールアドレスを返し、detectDuplicateEmailAddress を呼び出すと重複なしと判定する', async () => {
    const emailAddress = 'user@example.com';
    const normalizedEmail = 'user@example.com';
    const existingUserEmails: string[] = [];

    // validateEmailAddress をモック化
    jest.spyOn(inputValidation, 'validateEmailAddress').mockReturnValue({
      isValid: true,
      validatedEmailAddress: normalizedEmail,
      errorCode: null,
    });

    // detectDuplicateEmailAddress を呼び出す
    const result = await inputValidation.detectDuplicateEmailAddress({
      emailAddress,
      excludeUserId: undefined,
      existingUserEmails,
    });

    // 期待結果を検証
    expect(result).toBeDefined();
    expect(result.isDuplicate).toBe(false);
    expect(result.validatedEmailAddress).toBe('user@example.com');
    expect(result.errorCode).toBeNull();
  });
});
