import { detectDuplicateEmailAddress, type DetectDuplicateEmailAddressOutput } from '../../src/logic/input-validation-formatting';

describe('SCEN-169: メールアドレスが空または不正な形式の場合、入力エラーを発生させる', () => {
  it('step 1: should return EmailAddressEmpty when emailAddress is null', async () => {
    const existingUserEmails = ['user1@example.com', 'user2@example.com'];

    const result: DetectDuplicateEmailAddressOutput = await detectDuplicateEmailAddress({
      emailAddress: null,
      excludeUserId: undefined,
      existingUserEmails,
    });

    expect(result.errorCode).toBe('EmailAddressEmpty');
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.isDuplicate).toBe(false);
  });

  it('step 2: should return EmailAddressEmpty when emailAddress is undefined', async () => {
    const existingUserEmails = ['user1@example.com', 'user2@example.com'];

    const result: DetectDuplicateEmailAddressOutput = await detectDuplicateEmailAddress({
      emailAddress: undefined,
      excludeUserId: undefined,
      existingUserEmails,
    });

    expect(result.errorCode).toBe('EmailAddressEmpty');
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.isDuplicate).toBe(false);
  });

  it('step 3: should return EmailAddressEmpty when emailAddress is empty string', async () => {
    const existingUserEmails = ['user1@example.com', 'user2@example.com'];

    const result: DetectDuplicateEmailAddressOutput = await detectDuplicateEmailAddress({
      emailAddress: '',
      excludeUserId: undefined,
      existingUserEmails,
    });

    expect(result.errorCode).toBe('EmailAddressEmpty');
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.isDuplicate).toBe(false);
  });

  it('step 4: should return EmailAddressInvalidFormat when emailAddress has invalid format', async () => {
    const existingUserEmails = ['user1@example.com', 'user2@example.com'];

    const result: DetectDuplicateEmailAddressOutput = await detectDuplicateEmailAddress({
      emailAddress: 'invalid-email-format',
      excludeUserId: undefined,
      existingUserEmails,
    });

    expect(result.errorCode).toBe('EmailAddressInvalidFormat');
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.isDuplicate).toBe(false);
  });

  it('step 5: should return EmailAddressInvalidFormat when emailAddress lacks TLD', async () => {
    const existingUserEmails = ['user1@example.com', 'user2@example.com'];

    const result: DetectDuplicateEmailAddressOutput = await detectDuplicateEmailAddress({
      emailAddress: 'user@domain',
      excludeUserId: undefined,
      existingUserEmails,
    });

    expect(result.errorCode).toBe('EmailAddressInvalidFormat');
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.isDuplicate).toBe(false);
  });
});
