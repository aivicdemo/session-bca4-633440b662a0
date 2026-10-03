import { detectDuplicateEmailAddress } from '../../src/logic/input-validation-formatting';
import type {
  DetectDuplicateEmailAddressInput,
  DetectDuplicateEmailAddressOutput,
} from '../../src/logic/input-validation-formatting';

describe('SCEN-167: 登録または変更しようとするメールアドレスが一意であり、編集対象ユーザー自身は除外して判定する', () => {

  it('should detect duplicate when email exists in other users even with excludeUserId', async () => {
    const input: DetectDuplicateEmailAddressInput = {
      emailAddress: 'user@example.com',
      excludeUserId: 'user-002',
      existingUserEmails: [
        'admin@example.com',
        'user@example.com',
        'leader@example.com',
      ],
    };

    const result: DetectDuplicateEmailAddressOutput = await detectDuplicateEmailAddress(input);

    expect(result.isDuplicate).toBe(true);
    expect(result.validatedEmailAddress).toBe('user@example.com');
    expect(result.errorCode).toBeNull();
  });
});
