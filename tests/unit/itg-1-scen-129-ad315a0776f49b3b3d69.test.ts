import { describe, it, expect } from '@jest/globals';
import {
  validateEmailAddress,
  ValidateEmailAddressInput,
  ValidateEmailAddressOutput,
} from '../../src/logic/input-validation-formatting';

describe('SCEN-129: メールアドレスに.記号が含まれていない場合、INVALID_EMAIL_FORMAT エラーが返される', () => {
  it('メールアドレスに「.」記号が含まれていない場合、isValidがfalseを返し、validatedEmailAddressがnullを返し、errorCodeが\'INVALID_EMAIL_FORMAT\'を返す', async () => {
    const input: ValidateEmailAddressInput = {
      emailAddress: 'user@examplecom',
    };

    const result: ValidateEmailAddressOutput = await validateEmailAddress(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.errorCode).toBe('INVALID_EMAIL_FORMAT');
  });
});
