import {
  validateUserInformationRequired,
} from '../../src/logic/input-validation-formatting';
import type {
  ValidateUserInformationRequiredInput,
  ValidateUserInformationRequiredOutput,
} from '../../src/logic/input-validation-formatting';

describe('SCEN-146: 所属フィールドがnull・undefined・空白のみの場合、UserDepartmentEmptyErrorが発生して所属の確定値がnullになる', () => {
  test('所属がnullで、メールアドレスと名前が有効な場合、UserDepartmentEmptyErrorエラーが発生してisValidがfalse、validatedDepartmentがnullになる', async () => {
    // 所属フィールドが null、メールアドレスフィールドが有効、名前フィールドが有効の入力型オブジェクトを生成
    const input: ValidateUserInformationRequiredInput = {
      userName: '田中太郎',
      emailAddress: 'tanaka@example.com',
      department: null,
    };

    // validateUserInformationRequired 関数を上記オブジェクトで呼び出す
    const result = await validateUserInformationRequired(input);

    // 戻り値の isValid フィールドが false であることを確認
    expect(result.isValid).toBe(false);

    // 戻り値の validatedDepartment フィールドが null であることを確認
    expect(result.validatedDepartment).toBeNull();

    // 戻り値の validatedUserName フィールドが '田中太郎' であることを確認（名前は有効なため確定値として返される）
    expect(result.validatedUserName).toBe('田中太郎');

    // 戻り値の validatedEmailAddress フィールドが 'tanaka@example.com' であることを確認（メールアドレスは有効なため確定値として返される）
    expect(result.validatedEmailAddress).toBe('tanaka@example.com');

    // 戻り値の errorCode フィールドが 'DepartmentEmpty' であることを確認
    expect(result.errorCode).toBe('DepartmentEmpty');

    // 戻り値の errorDetails 配列に { field: 'department', errorCode: 'DepartmentEmpty' } が含まれることを確認
    expect(result.errorDetails).toContainEqual({
      field: 'department',
      errorCode: 'DepartmentEmpty',
    });
  });
});
