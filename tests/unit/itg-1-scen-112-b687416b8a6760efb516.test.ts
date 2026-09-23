import { describe, it, expect } from '@jest/globals';
import {
  validateDailyReportContent,
  ValidateDailyReportContentInput,
  ValidateDailyReportContentOutput,
} from '../../src/logic/input-validation-formatting';

describe('SCEN-112: エラー：空文字列が入力されたとき、EmptyOrNullContentErrorを返す', () => {
  it('should return EmptyOrNullContentError when empty string is input', () => {
    // ステップ1: validateDailyReportContent関数に入力型ValidateDailyReportContentInputのcontentフィールドに空文字列''を、
    // minimumCharacterLengthフィールドにデフォルト値10を指定して呼び出す
    const input: ValidateDailyReportContentInput = {
      content: '',
      minimumCharacterLength: 10,
    };

    // ステップ2: 関数の戻り値である出力型ValidateDailyReportContentOutputを取得する
    const output: ValidateDailyReportContentOutput = validateDailyReportContent(input);

    // 期待結果: 出力型ValidateDailyReportContentOutputのisValidフィールドがfalse、
    // validatedContentフィールドがnull、errorCodeフィールドが'EmptyOrNullContentError'となること。
    // エラー文言は'日報内容を入力してください。'と対応すること。
    expect(output.isValid).toBe(false);
    expect(output.validatedContent).toBeNull();
    expect(output.errorCode).toBe('EmptyOrNullContentError');
  });
});
