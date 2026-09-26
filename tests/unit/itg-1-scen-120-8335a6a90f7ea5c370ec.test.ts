import { describe, it, expect } from '@jest/globals';
import { validateDailyReportContent, type ValidateDailyReportContentInput, type ValidateDailyReportContentOutput } from '../../src/logic/input-validation-formatting';

describe('SCEN-120: エラー：最小文字数の境界値で1文字不足するテキストが入力されたとき、InsufficientContentLengthErrorを返す', () => {
  it('最小文字数より1文字不足するテキストを入力したとき、errorCodeがInsufficientContentLengthErrorである', async () => {
    const input: ValidateDailyReportContentInput = {
      content: '123456789',
      minimumCharacterLength: 10,
    };

    const result: ValidateDailyReportContentOutput = await validateDailyReportContent(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedContent).toBe(null);
    expect(result.errorCode).toBe('InsufficientContentLengthError');
  });
});
