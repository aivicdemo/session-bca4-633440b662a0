import { validateDailyReportContent, ValidateDailyReportContentInput, ValidateDailyReportContentOutput } from '../../src/logic/input-validation-formatting';

describe('SCEN-114: エラー：9文字のテキストが入力されたとき、InsufficientContentLengthErrorを返す', () => {
  it('9文字のテキストが入力されたとき、isValidがfalse、validatedContentがnull、errorCodeが\'InsufficientContentLengthError\'である', () => {
    const input: ValidateDailyReportContentInput = {
      content: '123456789',
      minimumCharacterLength: 10,
    };

    const result: ValidateDailyReportContentOutput = validateDailyReportContent(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedContent).toBeNull();
    expect(result.errorCode).toBe('InsufficientContentLengthError');
  });
});
