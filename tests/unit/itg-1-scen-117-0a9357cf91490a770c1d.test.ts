import { describe, it, expect } from '@jest/globals';
import {
  validateDailyReportContent,
  ValidateDailyReportContentInput,
  ValidateDailyReportContentOutput,
} from '../../src/logic/input-validation-formatting';

describe('SCEN-117: エラー：最小文字数をカスタム値で指定して、その値未満のテキストが入力されたとき、InsufficientContentLengthErrorを返す', () => {
  it('should return InsufficientContentLengthError when custom minimum character length is not satisfied', () => {
    // ステップ1: validateDailyReportContent関数を呼び出す。入力型ValidateDailyReportContentInputのフィールドに以下の値を設定する:
    // content='abc'（3文字）、minimumCharacterLength=5
    const input: ValidateDailyReportContentInput = {
      content: 'abc',
      minimumCharacterLength: 5,
    };

    // ステップ2: 関数が同期的に完了し、出力型ValidateDailyReportContentOutputを返すことを確認する
    // ステップ3: 出力のisValidフィールドがfalseであることを確認する
    // ステップ4: 出力のvalidatedContentフィールドがnullであることを確認する
    // ステップ5: 出力のerrorCodeフィールドが'InsufficientContentLengthError'であることを確認する
    const output: ValidateDailyReportContentOutput = validateDailyReportContent(input);

    // 期待結果: 入力テキスト'abc'（3文字）がカスタム指定の最小文字数5未満であるため、
    // isValid=false、validatedContent=null、errorCode='InsufficientContentLengthError'を返す。
    // これにより、日報内容が指定された最小文字数基準を満たさない入力を正しく検出し、送信を阻止する。
    expect(output.isValid).toBe(false);
    expect(output.validatedContent).toBeNull();
    expect(output.errorCode).toBe('InsufficientContentLengthError');
  });
});
