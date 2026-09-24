import { validateDailyReportContent, ValidateDailyReportContentInput, ValidateDailyReportContentOutput } from '../../src/logic/input-validation-formatting';

describe('SCEN-115: 正常系：デフォルト最小文字数10文字ちょうどのテキストが入力されたとき、検証済み内容を返して成功と判定する', () => {
  it('正確に10文字のテキストが入力されたとき、isValidがtrue、validatedContentが入力値、errorCodeがnullである', () => {
    const input: ValidateDailyReportContentInput = {
      content: '1234567890',
      minimumCharacterLength: 10,
    };

    const result: ValidateDailyReportContentOutput = validateDailyReportContent(input);

    expect(result.isValid).toBe(true);
    expect(result.validatedContent).toBe('1234567890');
    expect(result.errorCode).toBeNull();
  });
});
