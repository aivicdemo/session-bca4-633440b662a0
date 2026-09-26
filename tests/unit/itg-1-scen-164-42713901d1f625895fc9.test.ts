import { detectDuplicateEmailAddress } from '../../src/logic/input-validation-formatting';
import type {
  DetectDuplicateEmailAddressInput,
  DetectDuplicateEmailAddressOutput,
} from '../../src/logic/input-validation-formatting';

jest.mock('../../src/logic/input-validation-formatting');

describe('SCEN-164: 報告者が入力したメールアドレスが空文字列の場合、入力なしエラーを発生させる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return EmailAddressNotProvidedError when emailAddress is empty string', async () => {
    (detectDuplicateEmailAddress as jest.MockedFunction<any>).mockResolvedValue({
      isDuplicate: false,
      validatedEmailAddress: null,
      errorCode: 'EmailAddressNotProvidedError',
    });

    const input: DetectDuplicateEmailAddressInput = {
      emailAddress: '',
      excludeUserId: undefined,
      existingUserEmails: ['user1@example.com', 'user2@example.com'],
    };

    const result: DetectDuplicateEmailAddressOutput = await detectDuplicateEmailAddress(input);

    expect(result.isDuplicate).toBe(false);
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.errorCode).toBe('EmailAddressNotProvidedError');
  });
});
