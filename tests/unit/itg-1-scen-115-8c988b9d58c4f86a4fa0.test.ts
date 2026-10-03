import { describe, it, expect } from '@jest/globals';
import { validateDailyReportContent } from '../../src/logic/input-validation-formatting';

describe('SCEN-115: 正常系：デフォルト最小文字数10文字ちょうどのテキストが入力されたとき、検証済み内容を返して成功と判定する', () => {
  it('should return isValid=true with the validated content when exactly 10-character text is provided', async () => {
    const input = {
      content: '1234567890',
      minimumCharacterLength: 10,
    };

    const output = await validateDailyReportContent(input);

    expect(output.isValid).toBe(true);
    expect(output.validatedContent).toBe('1234567890');
    expect(output.errorCode).toBeNull();
  });
});
