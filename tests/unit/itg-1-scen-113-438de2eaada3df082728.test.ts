import { validateDailyReportContent, ValidateDailyReportContentInput, ValidateDailyReportContentOutput } from '../../src/logic/input-validation-formatting';

describe('SCEN-113: エラー：空白文字のみで構成されたテキストが入力されたとき、WhitespaceOnlyContentErrorを返す', () => {
  it('空白文字のみが入力されたとき、isValidがfalse、validatedContentがnull、errorCodeが\'WhitespaceOnlyContentError\'である', () => {
    const input: ValidateDailyReportContentInput = {
      content: '     ',
      minimumCharacterLength: 10,
    };

    const result: ValidateDailyReportContentOutput = validateDailyReportContent(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedContent).toBeNull();
    expect(result.errorCode).toBe('WhitespaceOnlyContentError');
  });
});
