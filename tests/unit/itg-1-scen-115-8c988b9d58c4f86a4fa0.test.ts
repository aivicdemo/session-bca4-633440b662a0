import { validateDailyReportContent, type ValidateDailyReportContentInput, type ValidateDailyReportContentOutput } from '../../src/logic/input-validation-formatting';

describe('SCEN-115: 正常系：デフォルト最小文字数10文字ちょうどのテキストが入力されたとき、検証済み内容を返して成功と判定する', () => {
  it('should return validated content when exactly 10-character text is provided', async () => {
    const input: ValidateDailyReportContentInput = {
      content: '1234567890',
      minimumCharacterLength: 10,
    };

    const result: ValidateDailyReportContentOutput = await validateDailyReportContent(input);

    expect(result.isValid).toBe(true);
    expect(result.validatedContent).toBe('1234567890');
    expect(result.errorCode).toBeNull();
  });
});
