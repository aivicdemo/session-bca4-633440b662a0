import {
  validateDailyReportContent,
  type ValidateDailyReportContentInput,
} from '../../src/logic/input-validation-formatting';

describe('SCEN-118: validateDailyReportContent - Whitespace only content', () => {
  test('should return WhitespaceOnlyContentError when input is all whitespace', async () => {
    const input: ValidateDailyReportContentInput = {
      content: '     ',
      minimumCharacterLength: 10,
    };

    const result = await validateDailyReportContent(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedContent).toBe(null);
    expect(result.errorCode).toBe('WhitespaceOnlyContentError');
  });
});
