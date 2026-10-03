import { describe, it, expect } from '@jest/globals';
import { validateDailyReportContent } from '../../src/logic/input-validation-formatting';

describe('SCEN-109: 正常系：10文字以上の有効な日報内容が入力されたとき、検証済み内容を返して成功と判定する', () => {
  it('should return isValid=true with the validated content when 10-character text is provided', async () => {
    const input = {
      content: '日報内容は十文字',
      minimumCharacterLength: 10,
    };

    const output = await validateDailyReportContent(input);

    expect(output.isValid).toBe(true);
    expect(output.validatedContent).toBe('日報内容は十文字');
    expect(output.errorCode).toBeNull();
  });
});
