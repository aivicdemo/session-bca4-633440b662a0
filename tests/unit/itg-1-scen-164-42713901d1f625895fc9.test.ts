import { describe, it, expect, jest } from '@jest/globals';
import {
  detectDuplicateEmailAddress,
  validateEmailAddress,
  EmailAddressNotProvidedError,
  DetectDuplicateEmailAddressInput,
  DetectDuplicateEmailAddressOutput,
} from '../../src/logic/input-validation-formatting';

describe('SCEN-164: 報告者が入力したメールアドレスが空文字列の場合、入力なしエラーを発生させる', () => {
  it('should return EmailAddressNotProvidedError when emailAddress is empty string', () => {
    // ステップ1: detectDuplicateEmailAddress関数を呼び出す際、以下の入力値を設定する
    const input: DetectDuplicateEmailAddressInput = {
      emailAddress: '',
      excludeUserId: undefined,
      existingUserEmails: ['user1@example.com', 'user2@example.com'],
    };

    // ステップ2: validateEmailAddress関数をスタブ化し、空文字列入力時の形式検証結果を制御可能にする
    jest.spyOn(require('../../src/logic/input-validation-formatting'), 'validateEmailAddress')
      .mockReturnValue({ isValid: false });

    // ステップ3: detectDuplicateEmailAddress関数を実行
    const result = detectDuplicateEmailAddress(input) as DetectDuplicateEmailAddressOutput;

    // ステップ4: 期待結果の検証
    expect(result.errorCode).toBe('EmailAddressNotProvidedError');
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.isDuplicate).toBe(false);
  });
});
