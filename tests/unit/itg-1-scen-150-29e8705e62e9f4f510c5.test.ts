import { validateUserInformationRequired, ValidateUserInformationRequiredOutput } from '../../src/logic/input-validation-formatting';

describe('SCEN-150: 最大許容文字数がデフォルト値を使用する場合、100文字以内で名前と所属が検証される', () => {
  it('should return isValid=true when all inputs are valid with default maximum lengths', async () => {
    const input = {
      userName: '山田太郎',
      emailAddress: 'yamada.taro@example.com',
      department: '営業部',
    };

    const result = await validateUserInformationRequired(input);

    expect(result.isValid).toBe(true);
    expect(result.validatedUserName).toBe('山田太郎');
    expect(result.validatedEmailAddress).toBe('yamada.taro@example.com');
    expect(result.validatedDepartment).toBe('営業部');
    expect(result.errorCode).toBe(null);
    expect(result.errorDetails).toBeUndefined();
  });
});
