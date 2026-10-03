import { describe, it, expect } from '@jest/globals';
import { validateDailyReportContent } from '../../src/logic/input-validation-formatting';

describe('SCEN-114: エラー：9文字のテキストが入力されたとき、InsufficientContentLengthErrorを返す', () => {
  it('should return errorCode=InsufficientContentLengthError when 9-character text is provided', async () => {
    const input = {
      content: '123456789',
      minimumCharacterLength: 10,
    };

    const output = await validateDailyReportContent(input);

    expect(output.isValid).toBe(false);
    expect(output.validatedContent).toBeNull();
    expect(output.errorCode).toBe('InsufficientContentLengthError');
  });
});
