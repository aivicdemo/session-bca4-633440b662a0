import { validateEmailAddress } from '../../src/logic/input-validation-formatting';

describe('SCEN-139: トップレベルドメインが2文字の場合、有効と判定される', () => {
  test('should validate email with 2-character TLD as valid', async () => {
    const input = {
      emailAddress: 'user@example.co',
    };

    const output = await validateEmailAddress(input);

    expect(output.isValid).toBe(true);
    expect(output.validatedEmailAddress).toBe('user@example.co');
    expect(output.errorCode).toBeNull();
  });
});
