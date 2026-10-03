import { validateUserInformationRequired } from '../../src/logic/input-validation-formatting';

describe('SCEN-150: 最大許容文字数がデフォルト値を使用する場合、100文字以内で名前と所属が検証される', () => {
  it('should validate name and department within 100 characters using default values', async () => {
    const result = await validateUserInformationRequired({
      userName: '山田太郎',
      emailAddress: 'yamada.taro@example.com',
      department: '営業部'
    });

    expect(result.isValid).toBe(true);
    expect(result.validatedUserName).toBe('山田太郎');
    expect(result.validatedEmailAddress).toBe('yamada.taro@example.com');
    expect(result.validatedDepartment).toBe('営業部');
    expect(result.errorCode).toBeNull();
    expect(result.errorDetails).toBeUndefined();
  });
});
