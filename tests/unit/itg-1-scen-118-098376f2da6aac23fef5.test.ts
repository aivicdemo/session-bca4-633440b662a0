import { describe, it, expect } from '@jest/globals';
import { validateDailyReportContent, type ValidateDailyReportContentInput, type ValidateDailyReportContentOutput } from '../../src/logic/input-validation-formatting';

describe('SCEN-118: エラー：全て空白文字のテキストが入力されたとき、WhitespaceOnlyContentErrorを返す', () => {
  it('5文字の空白が入力されたとき、isValidがfalse、validatedContentがnull、errorCodeが\'WhitespaceOnlyContentError\'である', async () => {
    const input: ValidateDailyReportContentInput = {
      content: '     ',
      minimumCharacterLength: 10,
    };

    const result: ValidateDailyReportContentOutput = await validateDailyReportContent(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedContent).toBe(null);
    expect(result.errorCode).toBe('WhitespaceOnlyContentError');
  });
});
