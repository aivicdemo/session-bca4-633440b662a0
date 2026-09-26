import { describe, it, expect } from '@jest/globals';
import { archivePastDailyReports, UserNotFoundError } from '../../src/logic/daily-report-persistence';

describe('SCEN-448: archivePastDailyReports - UserNotFoundError', () => {
  it('should throw UserNotFoundError when user ID does not exist in master', async () => {
    const input = {
      userId: 'non-existent-user-12345',
      archivedAt: '2024-01-15T09:30:00Z',
    };

    await expect(archivePastDailyReports(input)).rejects.toThrow(UserNotFoundError);
    await expect(archivePastDailyReports(input)).rejects.toThrow(
      'ユーザーID non-existent-user-12345 は見つかりません。'
    );
  });
});
