import { describe, it, expect } from '@jest/globals';
import {
  validateDailyReportContent,
  ValidateDailyReportContentInput,
  ValidateDailyReportContentOutput,
} from '../../src/logic/input-validation-formatting';

describe('SCEN-113: エラー：空白文字のみで構成されたテキストが入力されたとき、WhitespaceOnlyContentErrorを返す', () => {
  it('should return WhitespaceOnlyContentError when whitespace-only text is input', () => {
    // ステップ1: validateDailyReportContent関数を呼び出す際、入力型ValidateDailyReportContentInputのcontentフィールドに
    // 空白文字のみで構成されたテキスト（例：「     」（5文字分の空白））を設定する
    // ステップ2: minimumCharacterLengthフィールドはデフォルト値の10を使用する
    const input: ValidateDailyReportContentInput = {
      content: '     ',
      minimumCharacterLength: 10,
    };

    // ステップ3: validateDailyReportContent関数を実行する
    const output: ValidateDailyReportContentOutput = validateDailyReportContent(input);

    // ステップ4: 戻り値の出力型ValidateDailyReportContentOutputのisValidフィールドを確認する
    // ステップ5: 戻り値のvalidatedContentフィールドを確認する
    // ステップ6: 戻り値のerrorCodeフィールドを確認し、WhitespaceOnlyContentErrorエラーが返されたことを確認する

    // 期待結果: isValidはfalseである。validatedContentはnullである。errorCodeは'WhitespaceOnlyContentError'であり、
    // エラー文言は『日報内容は空白のみでは入力できません。』に対応している。
    // これは業務ルールbr-tx_1-002の制約「入力テキストが空または空白のみのとき → 業務内容を入力してください」を満たし、
    // 設計済みエラーの定義「入力テキストが空白文字のみで構成されている場合」に該当する。
    // なお、入力されたテキストが空白のみであるため、最小文字数の検証基準「10文字以上で入力してください」は適用される前に
    // 空白のみエラーが優先的に検出される。
    expect(output.isValid).toBe(false);
    expect(output.validatedContent).toBeNull();
    expect(output.errorCode).toBe('WhitespaceOnlyContentError');
  });
});
