import {
  detectDuplicateEmailAddress,
  DetectDuplicateEmailAddressInput,
  DetectDuplicateEmailAddressOutput,
} from '../../src/logic/input-validation-formatting';

describe('SCEN-161: 入力メールアドレスが null、undefined、または空文字列の場合、未入力エラーを返す', () => {
  it('should return EmailAddressNotProvidedError when emailAddress is null', async () => {
    const input: DetectDuplicateEmailAddressInput = {
      emailAddress: null,
      excludeUserId: undefined,
      existingUserEmails: [],
    };

    const result: DetectDuplicateEmailAddressOutput = await detectDuplicateEmailAddress(input);

    expect(result.isDuplicate).toBe(false);
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.errorCode).toBe('EmailAddressEmpty');
  });

  it('should return EmailAddressNotProvidedError when emailAddress is undefined', async () => {
    const input: DetectDuplicateEmailAddressInput = {
      emailAddress: undefined,
      excludeUserId: undefined,
      existingUserEmails: [],
    };

    const result: DetectDuplicateEmailAddressOutput = await detectDuplicateEmailAddress(input);

    expect(result.isDuplicate).toBe(false);
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.errorCode).toBe('EmailAddressEmpty');
  });

  it('should return EmailAddressNotProvidedError when emailAddress is empty string', async () => {
    const input: DetectDuplicateEmailAddressInput = {
      emailAddress: '',
      excludeUserId: undefined,
      existingUserEmails: [],
    };

    const result: DetectDuplicateEmailAddressOutput = await detectDuplicateEmailAddress(input);

    expect(result.isDuplicate).toBe(false);
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.errorCode).toBe('EmailAddressEmpty');
  });
});
