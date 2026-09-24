import { validateDailyReportContent, ValidateDailyReportContentInput, ValidateDailyReportContentOutput } from '../../src/logic/input-validation-formatting';

describe('SCEN-112: エラー：空文字列が入力されたとき、EmptyOrNullContentErrorを返す', () => {
  it('空文字列が入力されたとき、isValidがfalse、validatedContentがnull、errorCodeが\'EmptyOrNullContentError\'である', () => {
    const input: ValidateDailyReportContentInput = {
      content: '',
      minimumCharacterLength: 10,
    };

    const result: ValidateDailyReportContentOutput = validateDailyReportContent(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedContent).toBeNull();
    expect(result.errorCode).toBe('EmptyOrNullContentError');
  });
});
