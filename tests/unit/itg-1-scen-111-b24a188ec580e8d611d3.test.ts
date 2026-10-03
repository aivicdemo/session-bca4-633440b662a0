import { describe, it, expect } from '@jest/globals';
import { validateDailyReportContent } from '../../src/logic/input-validation-formatting';

describe('SCEN-111: エラー：undefinedが入力されたとき、EmptyOrNullContentErrorを返す', () => {
  it('should return errorCode=EmptyOrNullContentError when undefined is provided', async () => {
    const input = {
      content: undefined,
      minimumCharacterLength: 10,
    };

    const output = await validateDailyReportContent(input);

    expect(output.isValid).toBe(false);
    expect(output.validatedContent).toBeNull();
    expect(output.errorCode).toBe('EmptyOrNullContentError');
  });
});
