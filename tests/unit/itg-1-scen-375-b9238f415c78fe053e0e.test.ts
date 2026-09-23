import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { updateReporter } from '../../src/logic/reporter-master-management';
import * as validation from '../../src/logic/input-validation-formatting';
import { InvalidEmailFormatError } from '../../src/logic/reporter-master-management';

jest.mock('../../src/logic/input-validation-formatting');

describe('SCEN-375: InvalidEmailFormatError when email format is invalid', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvalidEmailFormatError for invalid email format', async () => {
    // validateEmailAddress をスタブ化して InvalidEmailFormatError を発生させる
    (validation.validateEmailAddress as any).mockRejectedValue(
      new InvalidEmailFormatError('メールアドレスの形式が正しくありません。')
    );

    const input = {
      reporterId: 'reporter-001',
      emailAddress: 'invalid-email-format',
      reporterName: undefined,
      department: undefined,
      status: undefined,
      teamLeaderId: 'leader-001',
      executionTimestamp: new Date('2024-01-15T10:00:00Z'),
    };

    // InvalidEmailFormatError が発生することを期待
    await expect(updateReporter(input)).rejects.toThrow(InvalidEmailFormatError);

    // エラーメッセージを確認
    try {
      await updateReporter(input);
    } catch (error) {
      if (error instanceof InvalidEmailFormatError) {
        expect(error.message).toBe('メールアドレスの形式が正しくありません。');
      }
    }
  });
});
