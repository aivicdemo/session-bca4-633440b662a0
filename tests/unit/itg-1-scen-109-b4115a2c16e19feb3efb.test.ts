import { validateDailyReportContent, ValidateDailyReportContentInput, ValidateDailyReportContentOutput } from '../../src/logic/input-validation-formatting';

describe('SCEN-109: 正常系：10文字以上の有効な日報内容が入力されたとき、検証済み内容を返して成功と判定する', () => {
  it('10文字の有効な日報内容を入力したとき、isValidがtrue、validatedContentが入力値、errorCodeがnullである', () => {
    const input: ValidateDailyReportContentInput = {
      content: '日報内容は十文字',
      minimumCharacterLength: 10,
    };

    const result: ValidateDailyReportContentOutput = validateDailyReportContent(input);

    expect(result.isValid).toBe(true);
    expect(result.validatedContent).toBe('日報内容は十文字');
    expect(result.errorCode).toBeNull();
  });
});
