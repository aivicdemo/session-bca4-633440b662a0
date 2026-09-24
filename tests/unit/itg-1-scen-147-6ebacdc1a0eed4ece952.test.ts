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

describe('SCEN-147: 名前の文字数が指定された最大許容文字数を超える場合、UserNameFormatInvalidErrorが発生して名前の確定値がnullになる', () => {
  test('名前が最大許容文字数を超える場合、UserNameFormatInvalidErrorが発生して名前の確定値がnullになる', () => {
    // 入力型 ValidateUserInformationRequiredInput を以下の値で構築する：
    // userName='あ'.repeat(101)（101文字）
    const input: ValidateUserInformationRequiredInput = {
      userName: 'あ'.repeat(101),
      emailAddress: 'user@example.com',
      department: '営業部',
      maximumUserNameLength: 100,
    };

    // validateUserInformationRequired 関数を上記入力で呼び出す
    const result: ValidateUserInformationRequiredOutput = validateUserInformationRequired(input);

    // 戻り値の出力型 ValidateUserInformationRequiredOutput を検証する
    expect(result.isValid).toBe(false);
    expect(result.validatedUserName).toBeNull();
    expect(result.validatedEmailAddress).toBe('user@example.com');
    expect(result.validatedDepartment).toBe('営業部');
    // errorCode が 'UserNameFormatInvalidError'
    expect(result.errorCode).toBe('UserNameFormatInvalidError');
    // エラー文言は「名前の形式が正しくありません。」
  });
});
