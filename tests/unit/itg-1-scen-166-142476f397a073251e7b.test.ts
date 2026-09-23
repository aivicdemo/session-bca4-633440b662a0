import { describe, it, expect, jest } from '@jest/globals';
import {
  detectDuplicateEmailAddress,
  validateEmailAddress,
  DuplicateEmailAddressError,
  DetectDuplicateEmailAddressInput,
  DetectDuplicateEmailAddressOutput,
} from '../../src/logic/input-validation-formatting';

describe('SCEN-166: 報告者が入力したメールアドレスが既存ユーザーと重複する場合、警告を返す', () => {
  it('should return DuplicateEmailAddressError when emailAddress is already registered', () => {
    // ステップ1: detectDuplicateEmailAddressを呼び出す際、以下の入力値を設定する
    const input: DetectDuplicateEmailAddressInput = {
      emailAddress: 'user@example.com',
      excludeUserId: undefined,
      existingUserEmails: ['admin@example.com', 'user@example.com', 'leader@example.com'],
    };

    // ステップ2: validateEmailAddressをスタブ化し、入力されたメールアドレス'user@example.com'に対して
    // 正規化済みのメールアドレス'user@example.com'を返すようモック設定する
    jest.spyOn(require('../../src/logic/input-validation-formatting'), 'validateEmailAddress')
      .mockReturnValue({ validatedEmailAddress: 'user@example.com' });

    // ステップ3: detectDuplicateEmailAddressを実行
    const result = detectDuplicateEmailAddress(input) as DetectDuplicateEmailAddressOutput;

    // ステップ4: 戻り値の以下のフィールドを検証する
    // 期待結果: isDuplicate=true、validatedEmailAddress='user@example.com'、errorCode='DuplicateEmailAddressError'
    expect(result.isDuplicate).toBe(true);
    expect(result.validatedEmailAddress).toBe('user@example.com');
    expect(result.errorCode).toBe('DuplicateEmailAddressError');
  });
});
