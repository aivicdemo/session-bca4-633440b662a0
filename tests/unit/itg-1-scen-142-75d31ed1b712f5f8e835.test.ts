import { validateUserInformationRequired } from '../../src/logic/input-validation-formatting';

describe('SCEN-142: 必須3項目すべてが有効な値で入力された場合、検証が成功して全項目が確定される', () => {
  test('should validate all required fields successfully when valid inputs are provided', async () => {
    const input = {
      userName: '田中太郎',
      emailAddress: 'tanaka.taro@example.com',
      department: '営業部',
      maximumUserNameLength: 100,
      maximumDepartmentLength: 100,
    };

    const result = await validateUserInformationRequired(input);

    expect(result.isValid).toBe(true);
    expect(result.validatedUserName).toBe('田中太郎');
    expect(result.validatedEmailAddress).toBe('tanaka.taro@example.com');
    expect(result.validatedDepartment).toBe('営業部');
    expect(result.errorCode).toBeNull();
    expect(result.errorDetails === undefined || result.errorDetails.length === 0).toBe(true);
  });
});
