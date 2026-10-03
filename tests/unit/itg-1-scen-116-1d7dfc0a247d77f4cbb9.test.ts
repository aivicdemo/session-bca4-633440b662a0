import { validateDailyReportContent } from '../../src/logic/input-validation-formatting';

describe('SCEN-116: 正常系：最小文字数をカスタム値で指定したとき、その値以上のテキストについて検証済み内容を返して成功と判定する', () => {
  it('should return isValid=true, validatedContent matching input, and errorCode=null when content meets custom minimum length of 13 characters', async () => {
    const input = {
      content: '正常系テスト用の日報内容です',
      minimumCharacterLength: 13,
    };

    const result = await validateDailyReportContent(input);

    expect(result.isValid).toBe(true);
    expect(result.validatedContent).toBe('正常系テスト用の日報内容です');
    expect(result.errorCode).toBeNull();
  });
});
