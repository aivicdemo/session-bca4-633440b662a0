import { describe, it, expect } from '@jest/globals';
import {
  validateDailyReportContent,
  ValidateDailyReportContentInput,
  ValidateDailyReportContentOutput,
} from '../../src/logic/input-validation-formatting';

describe('SCEN-119: 正常系：先頭と末尾に空白を含むテキストが入力されたとき、トリムされた検証済み内容を返して成功と判定する', () => {
  it('should return trimmed validated content as success when text with leading/trailing spaces is input', () => {
    // ステップ1: 入力型 ValidateDailyReportContentInput を生成する。
    // content に先頭と末尾に空白を含むテキスト「  正常な日報内容テキスト  」を設定し、
    // minimumCharacterLength はデフォルト値（10）とする。
    const input: ValidateDailyReportContentInput = {
      content: '  正常な日報内容テキスト  ',
      minimumCharacterLength: 10,
    };

    // ステップ2: validateDailyReportContent(input) を呼び出す。
    const output: ValidateDailyReportContentOutput = validateDailyReportContent(input);

    // ステップ3: 戻り値の ValidateDailyReportContentOutput を検証する。

    // 期待結果: isValid が true、validatedContent が「正常な日報内容テキスト」
    // （先頭末尾の空白がトリム済み、21文字）、errorCode が null であること。
    expect(output.isValid).toBe(true);
    expect(output.validatedContent).toBe('正常な日報内容テキスト');
    expect(output.errorCode).toBeNull();
  });
});
