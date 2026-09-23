import { describe, it, expect } from '@jest/globals';
import {
  validateDailyReportContent,
  ValidateDailyReportContentInput,
  ValidateDailyReportContentOutput,
} from '../../src/logic/input-validation-formatting';

describe('SCEN-109: 正常系：10文字以上の有効な日報内容が入力されたとき、検証済み内容を返して成功と判定する', () => {
  it('should return validated content as success when 10 characters or more valid report content is input', () => {
    // ステップ1: validateDailyReportContent関数を呼び出す。入力型ValidateDailyReportContentInputに以下の値を設定する:
    // content = '日報内容は十文字' (正確に10文字), minimumCharacterLength = 10（デフォルト値）
    const input: ValidateDailyReportContentInput = {
      content: '日報内容は十文字',
      minimumCharacterLength: 10,
    };

    // ステップ2: 関数の戻り値を受け取り、出力型ValidateDailyReportContentOutputのフィールドを確認する
    const output: ValidateDailyReportContentOutput = validateDailyReportContent(input);

    // 期待結果: isValidがtrueであり、validatedContentが'日報内容は十文字'（空白・nullが除去されていない正規の10文字テキスト）であり、errorCodeがnullであることを確認する
    expect(output.isValid).toBe(true);
    expect(output.validatedContent).toBe('日報内容は十文字');
    expect(output.errorCode).toBeNull();
  });
});
