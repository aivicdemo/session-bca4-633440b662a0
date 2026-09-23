import { describe, it, expect } from '@jest/globals';
import {
  validateDailyReportContent,
  ValidateDailyReportContentInput,
  ValidateDailyReportContentOutput,
} from '../../src/logic/input-validation-formatting';

describe('SCEN-111: エラー：undefinedが入力されたとき、EmptyOrNullContentErrorを返す', () => {
  it('should return EmptyOrNullContentError when undefined is input', () => {
    // ステップ1: validateDailyReportContent関数を呼び出す際、入力型ValidateDailyReportContentInputのcontentフィールドにundefinedを設定する
    // ステップ2: minimumCharacterLengthフィールドはデフォルト値（10）を使用する
    const input: ValidateDailyReportContentInput = {
      content: undefined,
      minimumCharacterLength: 10,
    };

    // ステップ3: validateDailyReportContent関数を実行する
    const output: ValidateDailyReportContentOutput = validateDailyReportContent(input);

    // 期待結果: 出力型ValidateDailyReportContentOutputが以下の値を返す:
    // isValidがfalse、validatedContentがnull、errorCodeが'EmptyOrNullContentError'である。
    // 設計済みエラーの条件「入力テキストがnull、undefined、または空文字列の場合」に合致し、
    // エラー文言は「日報内容を入力してください。」である。
    // これは業務ルール br-tx_1-002 の制約「[throw] 入力テキストが空または空白のみのとき → 「業務内容を入力してください」」に対応する。
    expect(output.isValid).toBe(false);
    expect(output.validatedContent).toBeNull();
    expect(output.errorCode).toBe('EmptyOrNullContentError');
  });
});
