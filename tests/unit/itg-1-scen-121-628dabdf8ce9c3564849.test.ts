import {
  validateDailyReportContent,
  type ValidateDailyReportContentInput,
} from '../../src/logic/input-validation-formatting';

describe('SCEN-121: validateDailyReportContent - Boundary value (minimum length)', () => {
  test('should return valid result when content equals minimum length exactly', async () => {
    const input: ValidateDailyReportContentInput = {
      content: '1234567890',
      minimumCharacterLength: 10,
    };

    const result = await validateDailyReportContent(input);

    expect(result.isValid).toBe(true);
    expect(result.validatedContent).toBe('1234567890');
    expect(result.errorCode).toBe(null);
  });
});
