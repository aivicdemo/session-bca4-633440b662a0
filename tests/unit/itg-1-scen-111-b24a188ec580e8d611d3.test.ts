import { validateDailyReportContent, ValidateDailyReportContentInput, ValidateDailyReportContentOutput } from '../../src/logic/input-validation-formatting';

describe('SCEN-111: エラー：undefinedが入力されたとき、EmptyOrNullContentErrorを返す', () => {
  it('undefinedが入力されたとき、isValidがfalse、validatedContentがnull、errorCodeが\'EmptyOrNullContentError\'である', () => {
    const input: ValidateDailyReportContentInput = {
      content: undefined,
      minimumCharacterLength: 10,
    };

    const result: ValidateDailyReportContentOutput = validateDailyReportContent(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedContent).toBeNull();
    expect(result.errorCode).toBe('EmptyOrNullContentError');
  });
});
