import { describe, it, expect } from '@jest/globals';
import {
  archivePastDailyReports,
  UserNotFoundError,
} from '../../src/logic/daily-report-persistence';

describe('SCEN-448: 指定されたユーザーIDがマスタに存在しない場合', () => {
  it('UserNotFoundErrorを発生させる', async () => {
    const input = {
      userId: 'non-existent-user-12345',
      archivedAt: '2024-01-15T09:30:00Z',
    };

    await expect(archivePastDailyReports(input)).rejects.toThrow(
      UserNotFoundError
    );
    await expect(archivePastDailyReports(input)).rejects.toThrow(
      'ユーザーID non-existent-user-12345 は見つかりません。'
    );
  });
});
