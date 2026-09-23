import { describe, it, expect } from '@jest/globals';
import {
  validateDailyReportContent,
  ValidateDailyReportContentInput,
  ValidateDailyReportContentOutput,
} from '../../src/logic/input-validation-formatting';

describe('SCEN-116: 正常系：最小文字数をカスタム値で指定したとき、その値以上のテキストについて検証済み内容を返して成功と判定する', () => {
  it('should return validated content as success when custom minimum character length is satisfied', () => {
    // ステップ1: validateDailyReportContent関数を呼び出す際、入力パラメータを以下の通り設定する：
    // content = '正常系テスト用の日報内容です' （13文字）、minimumCharacterLength = 13
    const input: ValidateDailyReportContentInput = {
      content: '正常系テスト用の日報内容です',
      minimumCharacterLength: 13,
    };

    // ステップ2: 関数が正常に実行されることを確認する
    // ステップ3: 戻り値の isValid フィールドが true であることを検証する
    // ステップ4: 戻り値の validatedContent フィールドが入力値と同一の '正常系テスト用の日報内容です' であることを検証する
    // ステップ5: 戻り値の errorCode フィールドが null であることを検証する
    const output: ValidateDailyReportContentOutput = validateDailyReportContent(input);

    // 期待結果: minimumCharacterLengthにカスタム値13を指定し、13文字以上のテキスト '正常系テスト用の日報内容です' を入力した場合、
    // isValid=true、validatedContent='正常系テスト用の日報内容です'、errorCode=null が返却される。
    // 入力基準を満たす内容として成功と判定される。
    expect(output.isValid).toBe(true);
    expect(output.validatedContent).toBe('正常系テスト用の日報内容です');
    expect(output.errorCode).toBeNull();
  });
});
