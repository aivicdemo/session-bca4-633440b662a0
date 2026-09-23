import { describe, it, expect, jest } from '@jest/globals';
import {
  detectDuplicateEmailAddress,
  validateEmailAddress,
  InvalidEmailAddressFormatError,
  DetectDuplicateEmailAddressInput,
  DetectDuplicateEmailAddressOutput,
} from '../../src/logic/input-validation-formatting';

describe('SCEN-165: 報告者が入力したメールアドレスが正しいメール形式でない場合、形式エラーを発生させる', () => {
  it('should return InvalidEmailAddressFormatError when emailAddress format is invalid', () => {
    // ステップ1: テスト対象の関数 detectDuplicateEmailAddress を呼び出す際の入力値を以下の通り設定する
    const input: DetectDuplicateEmailAddressInput = {
      emailAddress: 'invalid-email-format',
      excludeUserId: undefined,
      existingUserEmails: ['user1@example.com', 'user2@example.com'],
    };

    // ステップ2: 呼び出し先の validateEmailAddress がスタブとして InvalidEmailAddressFormatError を返すように設定する
    jest.spyOn(require('../../src/logic/input-validation-formatting'), 'validateEmailAddress')
      .mockImplementation(() => {
        throw new InvalidEmailAddressFormatError('メールアドレスの形式が正しくありません。');
      });

    // ステップ3: detectDuplicateEmailAddress を呼び出す
    const result = detectDuplicateEmailAddress(input) as DetectDuplicateEmailAddressOutput;

    // ステップ4: 返却された出力型 DetectDuplicateEmailAddressOutput の各フィールドを検証する
    expect(result.isDuplicate).toBe(false);
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.errorCode).toBe('InvalidEmailAddressFormatError');
  });
});
