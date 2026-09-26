import { validateDailyReportContent } from '../../src/logic/input-validation-formatting';

describe('SCEN-110: validateDailyReportContent - エラー系: null入力', () => {
  it('nullが入力されたとき、EmptyOrNullContentErrorを返す', async () => {
    const input = {
      content: null,
      minimumCharacterLength: 10
    };

    const result = await validateDailyReportContent(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedContent).toBeNull();
    expect(result.errorCode).toBe('EmptyOrNullContentError');
  });
});
