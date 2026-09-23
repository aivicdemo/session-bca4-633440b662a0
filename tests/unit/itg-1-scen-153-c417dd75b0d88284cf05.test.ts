import { validateUserInformationRequired, validateEmailAddress } from '../../src/logic/input-validation-formatting';
import type { ValidateUserInformationRequiredInput, ValidateUserInformationRequiredOutput } from '../../src/logic/input-validation-formatting';

describe('SCEN-153: チームリーダーが名前・メールアドレス・所属の形式と内容の検証を開始した場合、各項目の妥当性と全体の承認可否が判定される', () => {
  test('すべての必須項目が正しく入力されている場合、検証が成功する', () => {
    // ステップ1: validateUserInformationRequired関数を呼び出し、入力型を設定する
    const input: ValidateUserInformationRequiredInput = {
      userName: '田中太郎',
      emailAddress: 'tanaka@example.com',
      department: '営業部'
    };

    // ステップ2: validateEmailAddress関数をスタブ化（実装側で処理される）
    // ステップ3: validateUserInformationRequired関数を実行
    const result: ValidateUserInformationRequiredOutput = validateUserInformationRequired(input);

    // ステップ4: 出力型のフィールドを検証
    expect(result.isValid).toBe(true);
    expect(result.validatedUserName).toBe('田中太郎');
    expect(result.validatedEmailAddress).toBe('tanaka@example.com');
    expect(result.validatedDepartment).toBe('営業部');
    expect(result.errorCode).toBeNull();
    expect(result.errorDetails).toEqual([]);
  });
});
