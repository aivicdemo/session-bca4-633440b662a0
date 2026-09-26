import { validateDailyReportContent, type ValidateDailyReportContentInput, type ValidateDailyReportContentOutput } from '../../src/logic/input-validation-formatting';

describe('SCEN-113: エラー：空白文字のみで構成されたテキストが入力されたとき、WhitespaceOnlyContentErrorを返す', () => {
  it('should return WhitespaceOnlyContentError when whitespace-only string is provided', async () => {
    const input: ValidateDailyReportContentInput = {
      content: '     ',
      minimumCharacterLength: 10,
    };

    const result: ValidateDailyReportContentOutput = await validateDailyReportContent(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedContent).toBeNull();
    expect(result.errorCode).toBe('WhitespaceOnlyContentError');
  });
});
