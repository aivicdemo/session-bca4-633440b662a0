import { describe, it, expect } from '@jest/globals';
import {
  validateDailyReportContent,
  ValidateDailyReportContentInput,
  ValidateDailyReportContentOutput,
} from '../../src/logic/input-validation-formatting';

describe('SCEN-120: エラー：最小文字数の境界値で1文字不足するテキストが入力されたとき、InsufficientContentLengthErrorを返す', () => {
  it('should return InsufficientContentLengthError when text is 1 character short of minimum', () => {
    // ステップ1: validateDailyReportContent関数を呼び出す。入力パラメータは、
    // content: '123456789'（9文字、最小文字数10文字より1文字不足）、minimumCharacterLength: 10（デフォルト値）
    const input: ValidateDailyReportContentInput = {
      content: '123456789',
      minimumCharacterLength: 10,
    };

    // ステップ2: 関数の戻り値を取得する
    const output: ValidateDailyReportContentOutput = validateDailyReportContent(input);

    // 期待結果: 戻り値の型はValidateDailyReportContentOutputで、以下の値を持つこと：
    // isValid: false、validatedContent: null、errorCode: 'InsufficientContentLengthError'。
    // エラーコードはInsufficientContentLengthErrorであり、
    // 設計済みエラーの条件「入力テキストの文字数が最小文字数（10文字）未満の場合」を満たしていることを確認する。
    expect(output.isValid).toBe(false);
    expect(output.validatedContent).toBeNull();
    expect(output.errorCode).toBe('InsufficientContentLengthError');
  });
});
