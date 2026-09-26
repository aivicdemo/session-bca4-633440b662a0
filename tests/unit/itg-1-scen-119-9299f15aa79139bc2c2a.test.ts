import { describe, it, expect } from '@jest/globals';
import { validateDailyReportContent, type ValidateDailyReportContentInput, type ValidateDailyReportContentOutput } from '../../src/logic/input-validation-formatting';

describe('SCEN-119: 正常系：先頭と末尾に空白を含むテキストが入力されたとき、トリムされた検証済み内容を返して成功と判定する', () => {
  it('先頭と末尾に空白を含むテキストを入力したとき、トリムされたコンテンツが返される', async () => {
    const input: ValidateDailyReportContentInput = {
      content: '  正常な日報内容テキスト  ',
      minimumCharacterLength: 10,
    };

    const result: ValidateDailyReportContentOutput = await validateDailyReportContent(input);

    expect(result.isValid).toBe(true);
    expect(result.validatedContent).toBe('正常な日報内容テキスト');
    expect(result.errorCode).toBe(null);
  });
});
