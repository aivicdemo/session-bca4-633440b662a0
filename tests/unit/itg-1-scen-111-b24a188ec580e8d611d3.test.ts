import { validateDailyReportContent } from '../../src/logic/input-validation-formatting';

describe('SCEN-111: validateDailyReportContent - エラー系: undefined入力', () => {
  it('undefinedが入力されたとき、EmptyOrNullContentErrorを返す', async () => {
    const input = {
      content: undefined,
      minimumCharacterLength: 10
    };

    const result = await validateDailyReportContent(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedContent).toBeNull();
    expect(result.errorCode).toBe('EmptyOrNullContentError');
  });
});
