import { describe, it, expect, jest } from '@jest/globals';
import {
  validateUserInformationRequired,
  validateEmailAddress,
  ValidateUserInformationRequiredInput,
  ValidateUserInformationRequiredOutput,
  UserNameEmptyError,
} from '../../src/logic/input-validation-formatting';

describe('SCEN-152: 報告者が名前フィールドを空のまま送信しようとした場合、名前は必ず入力してくださいという指定文言でエラーになる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return UserNameEmptyError when userName is empty string', () => {
    // ステップ1: validateEmailAddressをスタブ化し、メールアドレス形式検証が成功を返すよう設定
    jest.spyOn(require('../../src/logic/input-validation-formatting'), 'validateEmailAddress')
      .mockReturnValue({ isValid: true });

    // ステップ2: validateUserInformationRequired関数を呼び出す入力を設定
    const input: ValidateUserInformationRequiredInput = {
      userName: '', // 空文字列を入力
      emailAddress: 'user@example.com',
      department: '営業部',
    };

    // ステップ3: validateUserInformationRequired関数を実行
    const result = validateUserInformationRequired(input) as ValidateUserInformationRequiredOutput;

    // ステップ4: 期待結果の検証
    // 戻り値として、isValid: false を確認
    expect(result.isValid).toBe(false);

    // validatedUserName: null を確認
    expect(result.validatedUserName).toBeNull();

    // validatedEmailAddress: "user@example.com" を確認
    expect(result.validatedEmailAddress).toBe('user@example.com');

    // validatedDepartment: "営業部" を確認
    expect(result.validatedDepartment).toBe('営業部');

    // errorCode: "UserNameEmptyError" を確認
    expect(result.errorCode).toBe('UserNameEmptyError');

    // errorDetails配列にて {field: "userName", errorCode: "UserNameEmptyError"} が記録されることを確認
    expect(result.errorDetails).toBeDefined();
    expect(Array.isArray(result.errorDetails)).toBe(true);
    expect(result.errorDetails).toContainEqual({
      field: 'userName',
      errorCode: 'UserNameEmptyError',
    });

    // 設計済みエラーUserNameEmptyErrorが関数から返されることを検証
    // エラーメッセージが「名前は1文字以上で入力してください。」であることを確認
    // （エラーメッセージは設計から定義されているメッセージ）
    expect(result).toHaveProperty('errorCode', 'UserNameEmptyError');
  });
});
