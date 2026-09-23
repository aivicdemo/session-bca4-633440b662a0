import { describe, it, expect } from '@jest/globals';
import {
  validateDailyReportContent,
  ValidateDailyReportContentInput,
  ValidateDailyReportContentOutput,
} from '../../src/logic/input-validation-formatting';

describe('SCEN-114: エラー：9文字のテキストが入力されたとき、InsufficientContentLengthErrorを返す', () => {
  it('should return InsufficientContentLengthError when 9 characters text is input', () => {
    // ステップ1: validateDailyReportContentの入力として、
    // content: '123456789'（9文字）、minimumCharacterLength: 10を渡す
    const input: ValidateDailyReportContentInput = {
      content: '123456789',
      minimumCharacterLength: 10,
    };

    // ステップ2: validateDailyReportContentを呼び出し、戻り値を取得する
    const output: ValidateDailyReportContentOutput = validateDailyReportContent(input);

    // 期待結果: 戻り値のisValidはfalse、validatedContentはnull、errorCodeは'InsufficientContentLengthError'である。
    // エラー文言は「日報内容は10文字以上で入力してください。」であり、
    // 業務ルール br-tx_1-002 の制約「[throw] 入力テキストが10文字未満のとき → 「10文字以上で入力してください」」を満たしている。
    // これは最小文字数の境界条件（10文字未満）を検証し、500文字以内の制約に違反しないテストケースである。
    expect(output.isValid).toBe(false);
    expect(output.validatedContent).toBeNull();
    expect(output.errorCode).toBe('InsufficientContentLengthError');
  });
});
