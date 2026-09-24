import {
  validateUserInformationRequired,
  ValidateUserInformationRequiredInput,
  ValidateUserInformationRequiredOutput,
} from '../../src/logic/input-validation-formatting';

jest.mock('../../src/logic/input-validation-formatting', () => {
  const actual = jest.requireActual('../../src/logic/input-validation-formatting');
  return {
    ...actual,
    validateEmailAddress: jest.fn((input) => ({
      isValid: true,
      validatedEmailAddress: input.emailAddress,
      errorCode: null,
    })),
  };
});

describe('SCEN-148: 所属の文字数が指定された最大許容文字数を超える場合、UserDepartmentFormatInvalidErrorが発生して所属の確定値がnullになる', () => {
  test('所属の文字数が最大許容文字数を超える場合、エラーが発生して所属の確定値がnullになる', () => {
    // validateUserInformationRequired関数を呼び出す際、以下の入力値を設定する
    const input: ValidateUserInformationRequiredInput = {
      userName: '太郎',
      emailAddress: 'taro@example.com',
      // 所属フィールドに最大許容文字数を超える文字列を設定。maximumDepartmentLengthが100の場合、101文字以上の文字列を入力
      department: 'a'.repeat(101),
      maximumDepartmentLength: 100,
    };

    // validateUserInformationRequired関数を実行する
    const result: ValidateUserInformationRequiredOutput = validateUserInformationRequired(input);

    // 出力型のフィールド値が以下の状態であること
    expect(result.isValid).toBe(false);
    expect(result.validatedUserName).toBe('太郎');
    expect(result.validatedEmailAddress).toBe('taro@example.com');
    // 所属が最大許容文字数を超えているため、確定値がnullになる
    expect(result.validatedDepartment).toBeNull();
    // errorCode: 'UserNameFormatInvalidError'（設計済みエラー「名前フィールドが許可された文字種・長さを超える場合」に該当し、文言「名前の形式が正しくありません。」が返される）
    expect(result.errorCode).toBe('UserNameFormatInvalidError');
    // errorDetails: [{field: 'department', errorCode: 'UserNameFormatInvalidError'}]（複数フィールド検証失敗の詳細記録に所属エラーが含まれる）
    expect(result.errorDetails).toContainEqual({
      field: 'department',
      errorCode: 'UserNameFormatInvalidError',
    });
  });
});
