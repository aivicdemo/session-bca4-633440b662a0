import { validateEmailAddress } from '../../src/logic/input-validation-formatting';

describe('SCEN-138: ローカル部にアンダースコアが含まれた正当な形式のメールアドレスを入力した場合、有効と判定される', () => {
  test('ローカル部にアンダースコアを含む正当なメールアドレスが有効と判定される', () => {
    const input = { emailAddress: 'user_name@example.com' };
    const result = validateEmailAddress(input);
    expect(result.isValid).toBe(true);
    expect(result.validatedEmailAddress).toBe('user_name@example.com');
    expect(result.errorCode).toBeNull();
  });
});
