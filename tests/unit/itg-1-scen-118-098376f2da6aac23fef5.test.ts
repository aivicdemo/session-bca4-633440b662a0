import { describe, it, expect } from '@jest/globals';
import {
  validateDailyReportContent,
  ValidateDailyReportContentInput,
  ValidateDailyReportContentOutput,
} from '../../src/logic/input-validation-formatting';

describe('SCEN-118: エラー：全て空白文字のテキストが入力されたとき、WhitespaceOnlyContentErrorを返す', () => {
  it('should return WhitespaceOnlyContentError when all whitespace text is input', () => {
    // ステップ1: validateDailyReportContent 関数を呼び出す
    // ステップ2: 入力型 ValidateDailyReportContentInput に以下の値を設定する：
    // content: '     '（5文字の空白）、minimumCharacterLength: 10（デフォルト）
    const input: ValidateDailyReportContentInput = {
      content: '     ',
      minimumCharacterLength: 10,
    };

    // ステップ3: 関数の戻り値を取得する
    const output: ValidateDailyReportContentOutput = validateDailyReportContent(input);

    // 期待結果: 出力型 ValidateDailyReportContentOutput の各フィールドが以下の状態を返す：
    // isValid は false、validatedContent は null、errorCode は 'WhitespaceOnlyContentError'。
    // これは設計済みエラー「WhitespaceOnlyContentError: 条件『入力テキストが空白文字のみで構成されている場合。』→ 文言『日報内容は空白のみでは入力できません。』」に合致する。
    expect(output.isValid).toBe(false);
    expect(output.validatedContent).toBeNull();
    expect(output.errorCode).toBe('WhitespaceOnlyContentError');
  });
});
