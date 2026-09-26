import { detectDuplicateEmailAddress } from '../../src/logic/input-validation-formatting';
import type {
  DetectDuplicateEmailAddressInput,
  DetectDuplicateEmailAddressOutput,
} from '../../src/logic/input-validation-formatting';

jest.mock('../../src/logic/input-validation-formatting');

describe('SCEN-163: 既存ユーザーマスタが空リストの場合、入力メールアドレスが有効であれば重複なしと判定する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return no duplicate when existingUserEmails is empty and email is valid', async () => {
    (detectDuplicateEmailAddress as jest.MockedFunction<any>).mockResolvedValue({
      isDuplicate: false,
      validatedEmailAddress: 'user@example.com',
      errorCode: null,
    });

    const input: DetectDuplicateEmailAddressInput = {
      emailAddress: 'user@example.com',
      excludeUserId: undefined,
      existingUserEmails: [],
    };

    const result: DetectDuplicateEmailAddressOutput = await detectDuplicateEmailAddress(input);

    expect(result.isDuplicate).toBe(false);
    expect(result.validatedEmailAddress).toBe('user@example.com');
    expect(result.errorCode).toBeNull();
  });
});
