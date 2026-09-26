import { validateDailyReportContent } from '../../src/logic/input-validation-formatting';

describe('SCEN-109: validateDailyReportContent - 正常系', () => {
  it('10文字以上の有効な日報内容が入力されたとき、検証済み内容を返して成功と判定する', async () => {
    const input = {
      content: '日報内容は十文字',
      minimumCharacterLength: 10
    };

    const result = await validateDailyReportContent(input);

    expect(result.isValid).toBe(true);
    expect(result.validatedContent).toBe('日報内容は十文字');
    expect(result.errorCode).toBeNull();
  });
});
