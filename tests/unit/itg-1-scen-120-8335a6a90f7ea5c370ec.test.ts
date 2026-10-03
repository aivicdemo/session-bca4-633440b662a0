import {
  validateDailyReportContent,
  type ValidateDailyReportContentInput,
} from '../../src/logic/input-validation-formatting';

describe('SCEN-120: validateDailyReportContent - Insufficient content length', () => {
  test('should return InsufficientContentLengthError when content is below minimum length', async () => {
    const input: ValidateDailyReportContentInput = {
      content: '123456789',
      minimumCharacterLength: 10,
    };

    const result = await validateDailyReportContent(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedContent).toBe(null);
    expect(result.errorCode).toBe('InsufficientContentLengthError');
  });
});
