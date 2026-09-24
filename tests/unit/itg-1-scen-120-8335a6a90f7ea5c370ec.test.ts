import { validateDailyReportContent, ValidateDailyReportContentInput, ValidateDailyReportContentOutput } from '../../src/logic/input-validation-formatting';

describe('SCEN-120: エラー：最小文字数の境界値で1文字不足するテキストが入力されたとき、InsufficientContentLengthErrorを返す', () => {
  it('最小文字数より1文字不足するテキストを入力したとき、errorCodeがInsufficientContentLengthErrorである', () => {
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
