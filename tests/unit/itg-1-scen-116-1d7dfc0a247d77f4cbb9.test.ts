import { validateDailyReportContent, ValidateDailyReportContentInput, ValidateDailyReportContentOutput } from '../../src/logic/input-validation-formatting';

describe('SCEN-116: 正常系：最小文字数をカスタム値で指定したとき、その値以上のテキストについて検証済み内容を返して成功と判定する', () => {
  it('カスタム最小文字数13で、13文字のテキストが入力されたとき、isValidがtrue、validatedContentが入力値、errorCodeがnullである', () => {
    const input: ValidateDailyReportContentInput = {
      content: '正常系テスト用の日報内容です',
      minimumCharacterLength: 13,
    };

    const result: ValidateDailyReportContentOutput = validateDailyReportContent(input);

    expect(result.isValid).toBe(true);
    expect(result.validatedContent).toBe('正常系テスト用の日報内容です');
    expect(result.errorCode).toBeNull();
  });
});
