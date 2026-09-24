import { validateDailyReportContent, ValidateDailyReportContentInput, ValidateDailyReportContentOutput } from '../../src/logic/input-validation-formatting';

describe('SCEN-121: 正常系：最小文字数の境界値ちょうどのテキストが入力されたとき、検証済み内容を返して成功と判定する', () => {
  it('最小文字数の境界値ちょうどのテキストを入力したとき、成功と判定される', () => {
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
