import { validateDailyReportContent, ValidateDailyReportContentInput, ValidateDailyReportContentOutput } from '../../src/logic/input-validation-formatting';

describe('SCEN-117: エラー：最小文字数をカスタム値で指定して、その値未満のテキストが入力されたとき、InsufficientContentLengthErrorを返す', () => {
  it('カスタム最小文字数5で、3文字のテキストが入力されたとき、isValidがfalse、validatedContentがnull、errorCodeが\'InsufficientContentLengthError\'である', () => {
    const input: ValidateDailyReportContentInput = {
      content: 'abc',
      minimumCharacterLength: 5,
    };

    const result: ValidateDailyReportContentOutput = validateDailyReportContent(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedContent).toBeNull();
    expect(result.errorCode).toBe('InsufficientContentLengthError');
  });
});
