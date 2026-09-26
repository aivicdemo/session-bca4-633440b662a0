import { validateDailyReportContent, type ValidateDailyReportContentInput, type ValidateDailyReportContentOutput } from '../../src/logic/input-validation-formatting';

describe('SCEN-116: 正常系：最小文字数をカスタム値で指定したとき、その値以上のテキストについて検証済み内容を返して成功と判定する', () => {
  it('should return validated content when custom minimum character length is satisfied', async () => {
    const input: ValidateDailyReportContentInput = {
      content: '正常系テスト用の日報内容です',
      minimumCharacterLength: 13,
    };

    const result: ValidateDailyReportContentOutput = await validateDailyReportContent(input);

    expect(result.isValid).toBe(true);
    expect(result.validatedContent).toBe('正常系テスト用の日報内容です');
    expect(result.errorCode).toBeNull();
  });
});
