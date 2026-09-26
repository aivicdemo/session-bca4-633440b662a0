import { describe, it, expect } from '@jest/globals';
import { archivePastDailyReports, ArchiveOperationFailedError } from '../../src/logic/daily-report-persistence';

describe('SCEN-450: archivePastDailyReports - ArchiveOperationFailedError', () => {
  it('should throw ArchiveOperationFailedError when database archive update fails', async () => {
    const input = {
      userId: 'user-123',
      archivedAt: '2025-01-15T10:00:00Z',
    };

    await expect(archivePastDailyReports(input)).rejects.toThrow(ArchiveOperationFailedError);
    await expect(archivePastDailyReports(input)).rejects.toThrow(
      '日報のアーカイブ処理に失敗しました。'
    );
  });
});
