import { describe, it, expect } from '@jest/globals';
import {
  validateDailyReportContent,
  ValidateDailyReportContentOutput,
} from '../../src/logic/input-validation-formatting';

describe('SCEN-121: 正常系：最小文字数の境界値ちょうどのテキストが入力されたとき、検証済み内容を返して成功と判定する', () => {
  it('最小文字数の境界値ちょうど（10文字）が入力されたとき、検証済み内容を返して成功と判定される', async () => {
    const input = '1234567890';
    const minimumCharacterLength = 10;

    const result: ValidateDailyReportContentOutput = await validateDailyReportContent({
      content: input,
      minimumCharacterLength,
    });

    expect(result.isValid).toBe(true);
    expect(result.validatedContent).toBe('1234567890');
    expect(result.errorCode).toBeNull();
  });
});
