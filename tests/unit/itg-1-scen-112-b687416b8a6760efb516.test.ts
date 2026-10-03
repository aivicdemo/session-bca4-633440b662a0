import { describe, it, expect } from '@jest/globals';
import { validateDailyReportContent } from '../../src/logic/input-validation-formatting';

describe('SCEN-112: エラー：空文字列が入力されたとき、EmptyOrNullContentErrorを返す', () => {
  it('should return errorCode=EmptyOrNullContentError when empty string is provided', async () => {
    const input = {
      content: '',
      minimumCharacterLength: 10,
    };

    const output = await validateDailyReportContent(input);

    expect(output.isValid).toBe(false);
    expect(output.validatedContent).toBeNull();
    expect(output.errorCode).toBe('EmptyOrNullContentError');
  });
});
