import { validateUserInformationRequired } from '../../src/logic/input-validation-formatting';

describe('SCEN-153: チームリーダーが名前・メールアドレス・所属の形式と内容の検証を開始した場合、各項目の妥当性と全体の承認可否が判定される', () => {
  it('should validate all required fields and return isValid=true when all inputs are correct', async () => {
    const result = await validateUserInformationRequired({
      userName: '田中太郎',
      emailAddress: 'tanaka@example.com',
      department: '営業部'
    });

    expect(result.isValid).toBe(true);
    expect(result.validatedUserName).toBe('田中太郎');
    expect(result.validatedEmailAddress).toBe('tanaka@example.com');
    expect(result.validatedDepartment).toBe('営業部');
    expect(result.errorCode).toBeNull();
    expect(result.errorDetails === undefined || result.errorDetails.length === 0).toBe(true);
  });
});
