import { validateEmailAddress } from '../../src/logic/input-validation-formatting';

describe('SCEN-137: ローカル部にハイフンが含まれた正当な形式のメールアドレスを入力した場合、有効と判定される', () => {
  test('ローカル部にハイフンを含む正当なメールアドレスが有効と判定される', () => {
    const input = { emailAddress: 'user-name@example.com' };
    const result = validateEmailAddress(input);
    expect(result.isValid).toBe(true);
    expect(result.validatedEmailAddress).toBe('user-name@example.com');
    expect(result.errorCode).toBeNull();
  });
});
