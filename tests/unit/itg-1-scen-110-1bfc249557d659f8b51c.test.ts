import { describe, it, expect } from '@jest/globals';
import {
  validateDailyReportContent,
  ValidateDailyReportContentInput,
  ValidateDailyReportContentOutput,
} from '../../src/logic/input-validation-formatting';

describe('SCEN-110: エラー：nullが入力されたとき、EmptyOrNullContentErrorを返す', () => {
  it('should return EmptyOrNullContentError when null is input', () => {
    // ステップ1: validateDailyReportContent関数を呼び出す。入力型ValidateDailyReportContentInputに以下の値をセットする：
    // content = null、minimumCharacterLength = 10（デフォルト値）
    const input: ValidateDailyReportContentInput = {
      content: null,
      minimumCharacterLength: 10,
    };

    // ステップ2: 関数の戻り値（出力型ValidateDailyReportContentOutput）を取得する
    const output: ValidateDailyReportContentOutput = validateDailyReportContent(input);

    // 期待結果: isValid = false、validatedContent = null、errorCode = 'EmptyOrNullContentError'を返す。
    // 設計済みエラー「EmptyOrNullContentError」の条件「入力テキストがnull、undefined、または空文字列の場合」に該当し、エラーコードが返される
    expect(output.isValid).toBe(false);
    expect(output.validatedContent).toBeNull();
    expect(output.errorCode).toBe('EmptyOrNullContentError');
  });
});
