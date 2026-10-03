import { validateDailyReportContent } from '../../src/logic/input-validation-formatting';

describe('SCEN-117: エラー：最小文字数をカスタム値で指定して、その値未満のテキストが入力されたとき、InsufficientContentLengthErrorを返す', () => {
  it('should return isValid=false, validatedContent=null, and errorCode=InsufficientContentLengthError when content is below custom minimum length', async () => {
    const input = {
      content: 'abc',
      minimumCharacterLength: 5,
    };

    const result = await validateDailyReportContent(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedContent).toBe(null);
    expect(result.errorCode).toBe('InsufficientContentLengthError');
  });
});
