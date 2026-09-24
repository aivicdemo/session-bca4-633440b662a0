import {
  detectDuplicateEmailAddress,
  DetectDuplicateEmailAddressInput,
  DetectDuplicateEmailAddressOutput,
} from '../../src/logic/input-validation-formatting';

describe('SCEN-161: 入力メールアドレスが null、undefined、または空文字列の場合、未入力エラーを返す', () => {
  it('should return EmailAddressNotProvidedError when emailAddress is null', () => {
    const input: DetectDuplicateEmailAddressInput = {
      emailAddress: null,
      excludeUserId: undefined,
      existingUserEmails: [],
    };

    const result: DetectDuplicateEmailAddressOutput = detectDuplicateEmailAddress(input);

    expect(result.isDuplicate).toBe(false);
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.errorCode).toBe('EmailAddressNotProvidedError');
  });

  it('should return EmailAddressNotProvidedError when emailAddress is undefined', () => {
    const input: DetectDuplicateEmailAddressInput = {
      emailAddress: undefined,
      excludeUserId: undefined,
      existingUserEmails: [],
    };

    const result: DetectDuplicateEmailAddressOutput = detectDuplicateEmailAddress(input);

    expect(result.isDuplicate).toBe(false);
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.errorCode).toBe('EmailAddressNotProvidedError');
  });

  it('should return EmailAddressNotProvidedError when emailAddress is empty string', () => {
    const input: DetectDuplicateEmailAddressInput = {
      emailAddress: '',
      excludeUserId: undefined,
      existingUserEmails: [],
    };

    const result: DetectDuplicateEmailAddressOutput = detectDuplicateEmailAddress(input);

    expect(result.isDuplicate).toBe(false);
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.errorCode).toBe('EmailAddressNotProvidedError');
  });
});
