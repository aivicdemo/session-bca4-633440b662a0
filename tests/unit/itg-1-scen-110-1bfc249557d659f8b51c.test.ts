import { validateDailyReportContent, ValidateDailyReportContentInput, ValidateDailyReportContentOutput } from '../../src/logic/input-validation-formatting';

describe('SCEN-110: エラー：nullが入力されたとき、EmptyOrNullContentErrorを返す', () => {
  it('nullが入力されたとき、isValidがfalse、validatedContentがnull、errorCodeが\'EmptyOrNullContentError\'である', () => {
    const input: ValidateDailyReportContentInput = {
      content: null,
      minimumCharacterLength: 10,
    };

    const result: ValidateDailyReportContentOutput = validateDailyReportContent(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedContent).toBeNull();
    expect(result.errorCode).toBe('EmptyOrNullContentError');
  });
});
