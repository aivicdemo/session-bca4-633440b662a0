import { describe, it, expect } from '@jest/globals';
import { archivePastDailyReports, NoReportsToArchiveError } from '../../src/logic/daily-report-persistence';

describe('SCEN-449: archivePastDailyReports - NoReportsToArchiveError', () => {
  it('should throw NoReportsToArchiveError when no unarchived reports exist for user', async () => {
    const input = {
      userId: 'user-001',
      archivedAt: '2024-01-15T10:00:00Z',
    };

    await expect(archivePastDailyReports(input)).rejects.toThrow(NoReportsToArchiveError);
    await expect(archivePastDailyReports(input)).rejects.toThrow(
      'ユーザーID user-001 のアーカイブ対象日報はありません。'
    );
  });
});
