import { validateDailyReportContent, type ValidateDailyReportContentInput, type ValidateDailyReportContentOutput } from '../../src/logic/input-validation-formatting';

describe('SCEN-114: エラー：9文字のテキストが入力されたとき、InsufficientContentLengthErrorを返す', () => {
  it('should return InsufficientContentLengthError when 9-character text is provided', async () => {
    const input: ValidateDailyReportContentInput = {
      content: '123456789',
      minimumCharacterLength: 10,
    };

    const result: ValidateDailyReportContentOutput = await validateDailyReportContent(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedContent).toBeNull();
    expect(result.errorCode).toBe('InsufficientContentLengthError');
  });
});
