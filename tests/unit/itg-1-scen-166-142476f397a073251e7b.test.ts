import { detectDuplicateEmailAddress } from '../../src/logic/input-validation-formatting';
import type {
  DetectDuplicateEmailAddressInput,
  DetectDuplicateEmailAddressOutput,
} from '../../src/logic/input-validation-formatting';

jest.mock('../../src/logic/input-validation-formatting');

describe('SCEN-166: 報告者が入力したメールアドレスが既存ユーザーと重複する場合、警告を返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('入力されたメールアドレスが既存ユーザーマスタ内に重複登録されている場合、isDuplicate=true、validatedEmailAddress、errorCode="DuplicateEmailAddressError"を返す', async () => {
    (detectDuplicateEmailAddress as jest.MockedFunction<any>).mockResolvedValue({
      isDuplicate: true,
      validatedEmailAddress: 'user@example.com',
      errorCode: 'DuplicateEmailAddressError',
    });

    const input: DetectDuplicateEmailAddressInput = {
      emailAddress: 'user@example.com',
      excludeUserId: undefined,
      existingUserEmails: ['admin@example.com', 'user@example.com', 'leader@example.com'],
    };

    const result: DetectDuplicateEmailAddressOutput = await detectDuplicateEmailAddress(input);

    expect(result.isDuplicate).toBe(true);
    expect(result.validatedEmailAddress).toBe('user@example.com');
    expect(result.errorCode).toBe('DuplicateEmailAddressError');
  });
});
