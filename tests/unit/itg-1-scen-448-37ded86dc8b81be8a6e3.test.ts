import { describe, it, expect, jest } from '@jest/globals';

jest.mock('../../src/logic/daily-report-persistence');

import {
  archivePastDailyReports,
  UserNotFoundError,
  ArchivePastDailyReportsInput,
} from '../../src/logic/daily-report-persistence';

describe('SCEN-448: 指定されたユーザーIDがマスタに存在しないとき、UserNotFoundErrorを発生させる', () => {
  it('UserNotFoundErrorが発生し、エラー文言が正しく返される', async () => {
    const error = new UserNotFoundError('ユーザーID non-existent-user-12345 は見つかりません。');
    (archivePastDailyReports as jest.Mock).mockRejectedValueOnce(error);

    const input: ArchivePastDailyReportsInput = {
      userId: 'non-existent-user-12345',
      archivedAt: '2024-01-15T09:30:00Z',
    };

    try {
      await archivePastDailyReports(input);
      fail('UserNotFoundErrorが発生するはずです');
    } catch (caughtError) {
      expect(caughtError).toBeInstanceOf(UserNotFoundError);
      expect((caughtError as any).message).toBe('ユーザーID non-existent-user-12345 は見つかりません。');
    }
  });
});
