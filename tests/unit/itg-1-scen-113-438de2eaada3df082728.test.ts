import { describe, it, expect } from '@jest/globals';
import { validateDailyReportContent } from '../../src/logic/input-validation-formatting';

describe('SCEN-113: エラー：空白文字のみで構成されたテキストが入力されたとき、WhitespaceOnlyContentErrorを返す', () => {
  it('should return errorCode=WhitespaceOnlyContentError when whitespace-only string is provided', async () => {
    const input = {
      content: '     ',
      minimumCharacterLength: 10,
    };

    const output = await validateDailyReportContent(input);

    expect(output.isValid).toBe(false);
    expect(output.validatedContent).toBeNull();
    expect(output.errorCode).toBe('WhitespaceOnlyContentError');
  });
});
