import { detectDuplicateEmailAddress } from '../../src/logic/input-validation-formatting';
import type {
  DetectDuplicateEmailAddressInput,
  DetectDuplicateEmailAddressOutput,
} from '../../src/logic/input-validation-formatting';

jest.mock('../../src/logic/input-validation-formatting');

describe('SCEN-165: 報告者が入力したメールアドレスが正しいメール形式でない場合、形式エラーを発生させる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return InvalidEmailAddressFormatError when emailAddress format is invalid', async () => {
    (detectDuplicateEmailAddress as jest.MockedFunction<any>).mockResolvedValue({
      isDuplicate: false,
      validatedEmailAddress: null,
      errorCode: 'InvalidEmailAddressFormatError',
    });

    const input: DetectDuplicateEmailAddressInput = {
      emailAddress: 'invalid-email-format',
      excludeUserId: undefined,
      existingUserEmails: ['user1@example.com', 'user2@example.com'],
    };

    const result: DetectDuplicateEmailAddressOutput = await detectDuplicateEmailAddress(input);

    expect(result.isDuplicate).toBe(false);
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.errorCode).toBe('InvalidEmailAddressFormatError');
  });
});
