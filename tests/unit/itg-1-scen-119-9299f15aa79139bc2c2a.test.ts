import {
  validateDailyReportContent,
  type ValidateDailyReportContentInput,
} from '../../src/logic/input-validation-formatting';

describe('SCEN-119: validateDailyReportContent - Trim whitespace', () => {
  test('should trim leading and trailing whitespace and return valid result', async () => {
    const input: ValidateDailyReportContentInput = {
      content: '  正常な日報内容テキスト  ',
      minimumCharacterLength: 10,
    };

    const result = await validateDailyReportContent(input);

    expect(result.isValid).toBe(true);
    expect(result.validatedContent).toBe('正常な日報内容テキスト');
    expect(result.errorCode).toBe(null);
  });
});
