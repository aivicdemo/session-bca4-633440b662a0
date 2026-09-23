import { describe, it, expect } from '@jest/globals';
import {
  validateDailyReportContent,
  ValidateDailyReportContentInput,
  ValidateDailyReportContentOutput,
} from '../../src/logic/input-validation-formatting';

describe('SCEN-115: 正常系：デフォルト最小文字数10文字ちょうどのテキストが入力されたとき、検証済み内容を返して成功と判定する', () => {
  it('should return validated content as success when exactly 10 characters text is input', () => {
    // ステップ1: 入力型 ValidateDailyReportContentInput を構築する：
    // content に正確に10文字のテキスト「1234567890」を設定し、minimumCharacterLength はデフォルト値（10）を使用する
    const input: ValidateDailyReportContentInput = {
      content: '1234567890',
      minimumCharacterLength: 10,
    };

    // ステップ2: validateDailyReportContent 関数を呼び出し、構築した入力を渡す
    const output: ValidateDailyReportContentOutput = validateDailyReportContent(input);

    // ステップ3: 戻り値の ValidateDailyReportContentOutput を検証する

    // 期待結果: 出力型 ValidateDailyReportContentOutput の値が以下を満たす：
    // isValid は true、validatedContent は「1234567890」（入力されたテキスト）、errorCode は null
    expect(output.isValid).toBe(true);
    expect(output.validatedContent).toBe('1234567890');
    expect(output.errorCode).toBeNull();
  });
});
