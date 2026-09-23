import { validateEmailAddress } from '../../src/logic/input-validation-formatting';

describe('SCEN-136: ローカル部にドットが含まれた正当な形式のメールアドレスを入力した場合、有効と判定される', () => {
  test('ローカル部にドットを含む正当なメールアドレスが有効と判定される', () => {
    const input = { emailAddress: 'john.doe@example.com' };
    const result = validateEmailAddress(input);
    expect(result.isValid).toBe(true);
    expect(result.validatedEmailAddress).toBe('john.doe@example.com');
    expect(result.errorCode).toBeNull();
  });
});
