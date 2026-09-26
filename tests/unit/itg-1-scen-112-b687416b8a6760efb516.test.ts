import { validateDailyReportContent, type ValidateDailyReportContentInput, type ValidateDailyReportContentOutput } from '../../src/logic/input-validation-formatting';

describe('SCEN-112: エラー：空文字列が入力されたとき、EmptyOrNullContentErrorを返す', () => {
  it('should return EmptyOrNullContentError when empty string is provided', async () => {
    const input: ValidateDailyReportContentInput = {
      content: '',
      minimumCharacterLength: 10,
    };

    const result: ValidateDailyReportContentOutput = await validateDailyReportContent(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedContent).toBeNull();
    expect(result.errorCode).toBe('EmptyOrNullContentError');
  });
});
